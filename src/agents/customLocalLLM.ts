import { BaseLLM, BaseLLMParams } from '@langchain/core/language_models/llms';
import { LLMResult, Generation } from '@langchain/core/outputs';
import { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager';

const DEFAULT_BASE_URL = process.env.LOCAL_LLM_BASE_URL ?? 'http://localhost:11434';
const DEFAULT_MODEL = process.env.LOCAL_LLM_MODEL ?? 'llama3';
const DEFAULT_TIMEOUT = parseInt(process.env.LOCAL_LLM_TIMEOUT_MS ?? '8000', 10);
const DEFAULT_TEMP = 0.7;
const DEFAULT_MAX_TOKENS = 512;
const MAX_RETRIES = 1;
const RETRY_DELAY_BASE = 300;

export interface CustomLocalLLMParams extends BaseLLMParams {
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  maxRetries?: number;
}

interface OllamaRequestBody {
  model: string;
  prompt: string;
  stream: false;
  options: { temperature: number; num_predict: number };
}

interface OllamaSuccessResponse {
  response: string;
  done: boolean;
  model?: string;
  total_duration?: number;
}

interface OllamaErrorResponse {
  error: string;
}

type OllamaResponse = OllamaSuccessResponse | OllamaErrorResponse;

export class LocalLLMError extends Error {
  public readonly code: 'TIMEOUT' | 'SERVER_ERROR' | 'INVALID_RESPONSE' | 'MODEL_ERROR' | 'NETWORK_ERROR';
  public readonly statusCode?: number;

  constructor(
    message: string,
    code: 'TIMEOUT' | 'SERVER_ERROR' | 'INVALID_RESPONSE' | 'MODEL_ERROR' | 'NETWORK_ERROR',
    statusCode?: number
  ) {
    super(message);
    this.name = 'LocalLLMError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

class ResponseMatcher {
  private static readonly patterns: Array<{ regex: RegExp; response: string }> = [
    { regex: /^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening))/i, response: 'Hello! How can I assist you today?' },
    { regex: /^(bye|goodbye|see\s*you|take\s*care)/i, response: 'Goodbye! Have a great day!' },
    { regex: /^(thanks|thank\s*you|thx)/i, response: 'You are welcome! Let me know if you need anything else.' },
    { regex: /(help|support|assist|guide)/i, response: 'I am here to help. Please describe what you need assistance with.' },
    { regex: /(who\s*are\s*you|what\s*are\s*you)/i, response: 'I am an AI assistant designed to help answer your questions.' },
    { regex: /(how\s*are\s*you|how\s*do\s*you\s*do)/i, response: 'I am functioning well. Thank you for asking. How can I help you?' },
    { regex: /(what\s*can\s*you\s*do|your\s*capabilities)/i, response: 'I can answer questions, provide information, and assist with various tasks.' },
  ];

  static match(query: string): string | null {
    const normalized = query.trim().toLowerCase();
    for (const pattern of this.patterns) {
      if (pattern.regex.test(normalized)) {
        return pattern.response;
      }
    }
    return null;
  }

  static getDefaultResponse(query: string): string {
    const truncated = query.length > 50 ? query.slice(0, 50) + '...' : query;
    return `I understand your query regarding "${truncated}". Could you please provide more specific details?`;
  }
}

class HttpClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(baseUrl: string, timeoutMs: number) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.timeoutMs = timeoutMs;
  }

  async post<T>(endpoint: string, body: object): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new LocalLLMError(`HTTP ${response.status}`, 'SERVER_ERROR', response.status);
      }

      return await response.json() as T;
    } catch (error: unknown) {
      clearTimeout(timer);
      
      if (error instanceof LocalLLMError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      
      if (message.includes('abort')) {
        throw new LocalLLMError(`Request timed out after ${this.timeoutMs}ms`, 'TIMEOUT');
      }

      throw new LocalLLMError(`Network error: ${message}`, 'NETWORK_ERROR');
    }
  }

  async get<T>(endpoint: string, timeoutMs?: number): Promise<T> {
    const controller = new AbortController();
    const timeout = timeoutMs ?? this.timeoutMs;
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new LocalLLMError(`HTTP ${response.status}`, 'SERVER_ERROR', response.status);
      }

      return await response.json() as T;
    } catch (error: unknown) {
      clearTimeout(timer);
      
      if (error instanceof LocalLLMError) {
        throw error;
      }

      throw new LocalLLMError('Network error', 'NETWORK_ERROR');
    }
  }

  async ping(endpoint: string, timeoutMs: number): Promise<boolean> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timer);
      return response.ok;
    } catch {
      clearTimeout(timer);
      return false;
    }
  }
}

class ServerAvailabilityCache {
  private static instance: ServerAvailabilityCache;
  private isAvailable: boolean | null = null;
  private lastCheckedAt: number = 0;
  private readonly cacheTtlMs: number = 60000;

  private constructor() {}

  static getInstance(): ServerAvailabilityCache {
    if (!ServerAvailabilityCache.instance) {
      ServerAvailabilityCache.instance = new ServerAvailabilityCache();
    }
    return ServerAvailabilityCache.instance;
  }

  isCacheValid(): boolean {
    return (Date.now() - this.lastCheckedAt) < this.cacheTtlMs && this.isAvailable !== null;
  }

  get(): boolean | null {
    return this.isCacheValid() ? this.isAvailable : null;
  }

  set(value: boolean): void {
    this.isAvailable = value;
    this.lastCheckedAt = Date.now();
  }

  invalidate(): void {
    this.isAvailable = null;
    this.lastCheckedAt = 0;
  }

  markUnavailable(): void {
    this.isAvailable = false;
    this.lastCheckedAt = Date.now();
  }
}

class RetryHandler {
  private readonly maxRetries: number;
  private readonly baseDelay: number;

  constructor(maxRetries: number, baseDelay: number) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
  }

  async execute<T>(operation: () => Promise<T>, shouldRetry: (error: unknown) => boolean): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (shouldRetry(error) && attempt < this.maxRetries) {
          const delay = this.baseDelay * Math.pow(2, attempt);
          await this.sleep(delay);
        } else {
          break;
        }
      }
    }

    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class PromptValidator {
  private readonly maxLength: number;

  constructor(maxLength: number = 4000) {
    this.maxLength = maxLength;
  }

  validate(prompt: string): string {
    if (typeof prompt !== 'string') {
      throw new TypeError('Prompt must be a string');
    }

    const trimmed = prompt.trim();

    if (!trimmed) {
      throw new Error('Prompt cannot be empty');
    }

    if (trimmed.length > this.maxLength) {
      return trimmed.slice(0, this.maxLength);
    }

    return trimmed;
  }
}

class ConfigValidator {
  static validate(config: {
    baseUrl: string;
    model: string;
    temperature: number;
    maxTokens: number;
    timeoutMs: number;
  }): void {
    if (!config.baseUrl.startsWith('http')) {
      throw new Error(`Invalid baseUrl: "${config.baseUrl}"`);
    }

    if (!config.model.trim()) {
      throw new Error('Model name cannot be empty');
    }

    if (config.temperature < 0 || config.temperature > 2) {
      throw new RangeError('Temperature must be between 0 and 2');
    }

    if (config.maxTokens < 1 || config.maxTokens > 32768) {
      throw new RangeError('MaxTokens must be between 1 and 32768');
    }

    if (config.timeoutMs < 1000) {
      throw new RangeError('TimeoutMs must be at least 1000ms');
    }
  }
}

export class CustomLocalLLM extends BaseLLM {
  private readonly _baseUrl: string;
  private readonly _model: string;
  private readonly _temperature: number;
  private readonly _maxTokens: number;
  private readonly _timeoutMs: number;
  private readonly _maxRetries: number;

  private readonly httpClient: HttpClient;
  private readonly retryHandler: RetryHandler;
  private readonly promptValidator: PromptValidator;
  private readonly availabilityCache: ServerAvailabilityCache;

  constructor(params: CustomLocalLLMParams = {}) {
    super(params);

    this._baseUrl = (params.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    this._model = params.model ?? DEFAULT_MODEL;
    this._temperature = params.temperature ?? DEFAULT_TEMP;
    this._maxTokens = params.maxTokens ?? DEFAULT_MAX_TOKENS;
    this._timeoutMs = params.timeoutMs ?? DEFAULT_TIMEOUT;
    this._maxRetries = params.maxRetries ?? MAX_RETRIES;

    ConfigValidator.validate({
      baseUrl: this._baseUrl,
      model: this._model,
      temperature: this._temperature,
      maxTokens: this._maxTokens,
      timeoutMs: this._timeoutMs,
    });

    this.httpClient = new HttpClient(this._baseUrl, this._timeoutMs);
    this.retryHandler = new RetryHandler(this._maxRetries, RETRY_DELAY_BASE);
    this.promptValidator = new PromptValidator();
    this.availabilityCache = ServerAvailabilityCache.getInstance();
  }

  get baseUrl(): string { return this._baseUrl; }
  get model(): string { return this._model; }
  get temperature(): number { return this._temperature; }
  get maxTokens(): number { return this._maxTokens; }
  get timeoutMs(): number { return this._timeoutMs; }
  get maxRetries(): number { return this._maxRetries; }

  _llmType(): string {
    return 'custom_local_llm';
  }

  async _generate(
    prompts: string[],
    _options: this['ParsedCallOptions'],
    _runManager?: CallbackManagerForLLMRun
  ): Promise<LLMResult> {
    const isAvailable = await this.checkServerAvailable();

    if (!isAvailable) {
      throw new LocalLLMError('Ollama server is not available', 'NETWORK_ERROR');
    }

    const generations = await Promise.all(
      prompts.map(prompt => this.generateSingle(prompt))
    );

    return { generations };
  }

  private async generateSingle(prompt: string): Promise<Generation[]> {
    const sanitized = this.promptValidator.validate(prompt);
    const text = await this.callWithRetry(sanitized);
    return [{ text }];
  }

  private async checkServerAvailable(): Promise<boolean> {
    const cached = this.availabilityCache.get();
    
    if (cached !== null) {
      return cached;
    }

    const isAvailable = await this.httpClient.ping('/api/tags', 2000);
    this.availabilityCache.set(isAvailable);

    return isAvailable;
  }

  private async callWithRetry(prompt: string): Promise<string> {
    try {
      return await this.retryHandler.execute(
        () => this.callOllama(prompt),
        (error) => this.isTransientError(error)
      );
    } catch (error) {
      this.availabilityCache.markUnavailable();
      throw error;
    }
  }

  private async callOllama(prompt: string): Promise<string> {
    const body: OllamaRequestBody = {
      model: this._model,
      prompt,
      stream: false,
      options: {
        temperature: this._temperature,
        num_predict: this._maxTokens,
      },
    };

    const response = await this.httpClient.post<OllamaResponse>('/api/generate', body);

    if (this.isErrorResponse(response)) {
      throw new LocalLLMError(response.error, 'MODEL_ERROR');
    }

    const text = response.response?.trim() ?? '';

    if (!text) {
      throw new LocalLLMError('Empty response from model', 'INVALID_RESPONSE');
    }

    return text;
  }

  private isErrorResponse(response: OllamaResponse): response is OllamaErrorResponse {
    return typeof (response as OllamaErrorResponse).error === 'string';
  }

  private isTransientError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    const message = error.message.toLowerCase();
    const transientPatterns = ['timeout', 'econnrefused', 'econnreset', 'network', 'socket', 'fetch failed'];

    return transientPatterns.some(pattern => message.includes(pattern));
  }

  async healthCheck(): Promise<{ ok: boolean; model: string; error?: string }> {
    try {
      const isAvailable = await this.httpClient.ping('/api/tags', 5000);
      return { ok: isAvailable, model: this._model };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { ok: false, model: this._model, error: message };
    }
  }

  static async isAvailable(baseUrl?: string): Promise<boolean> {
    const url = (baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    const client = new HttpClient(url, 2000);
    return client.ping('/api/tags', 2000);
  }

  static resetAvailabilityCache(): void {
    ServerAvailabilityCache.getInstance().invalidate();
  }
}

export async function handleCommonQuery(query: string): Promise<string> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return 'Please provide a valid query.';
  }

  const matchedResponse = ResponseMatcher.match(normalizedQuery);

  if (matchedResponse) {
    return matchedResponse;
  }

  try {
    const isServerAvailable = await CustomLocalLLM.isAvailable();

    if (!isServerAvailable) {
      return ResponseMatcher.getDefaultResponse(normalizedQuery);
    }

    const llm = new CustomLocalLLM({
      temperature: 0.3,
      maxTokens: 256,
      timeoutMs: 5000,
    });

    const result = await llm._generate([normalizedQuery], {});
    const generatedText = result.generations[0]?.[0]?.text;

    return generatedText ?? ResponseMatcher.getDefaultResponse(normalizedQuery);
  } catch {
    return ResponseMatcher.getDefaultResponse(normalizedQuery);
  }
}

export default CustomLocalLLM;