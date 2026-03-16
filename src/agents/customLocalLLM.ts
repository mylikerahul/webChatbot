import { BaseLLM, BaseLLMParams } from '@langchain/core/language_models/llms';
import { LLMResult, Generation } from '@langchain/core/outputs';
import { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_BASE_URL   = process.env.LOCAL_LLM_BASE_URL  ?? 'http://localhost:11434';
const DEFAULT_MODEL      = process.env.LOCAL_LLM_MODEL     ?? 'llama3';
const DEFAULT_TIMEOUT    = parseInt(process.env.LOCAL_LLM_TIMEOUT_MS ?? '8000', 10); // ✅ 8s (was 30s — too long)
const DEFAULT_TEMP       = 0.7;
const DEFAULT_MAX_TOKENS = 512; // ✅ Reduced (was 1024 — faster response)
const MAX_RETRIES        = 1;   // ✅ Only 1 retry (was 2 — too slow on failure)
const RETRY_DELAY_BASE   = 300;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CustomLocalLLMParams extends BaseLLMParams {
  baseUrl?:     string;
  model?:       string;
  temperature?: number;
  maxTokens?:   number;
  timeoutMs?:   number;
  maxRetries?:  number;
}

interface OllamaRequestBody {
  model:   string;
  prompt:  string;
  stream:  false;
  options: { temperature: number; num_predict: number };
}

interface OllamaSuccessResponse {
  response:        string;
  done:            boolean;
  model?:          string;
  total_duration?: number;
}

interface OllamaErrorResponse { error: string }
type OllamaResponse = OllamaSuccessResponse | OllamaErrorResponse;

function isOllamaError(b: OllamaResponse): b is OllamaErrorResponse {
  return typeof (b as OllamaErrorResponse).error === 'string';
}

function sleep(ms: number): Promise<void> {
  return new Promise(res => setTimeout(res, ms));
}

function isTransientError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes('timeout')     ||
    msg.includes('econnrefused') ||
    msg.includes('econnreset')  ||
    msg.includes('network')     ||
    msg.includes('socket')      ||
    msg.includes('fetch failed')
  );
}

// ─── Custom Error ─────────────────────────────────────────────────────────────

export class LocalLLMError extends Error {
  constructor(
    message: string,
    public readonly code: 'TIMEOUT' | 'SERVER_ERROR' | 'INVALID_RESPONSE' | 'MODEL_ERROR' | 'NETWORK_ERROR',
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'LocalLLMError';
  }
}

// ─── Main Class ───────────────────────────────────────────────────────────────

export class CustomLocalLLM extends BaseLLM {
  baseUrl:     string;
  model:       string;
  temperature: number;
  maxTokens:   number;
  timeoutMs:   number;
  maxRetries:  number;

  // ✅ Static cache — checked once per process, not per request
  private static _serverAvailable: boolean | null = null;
  private static _lastCheckedAt: number = 0;
  private static readonly CACHE_TTL_MS = 60_000; // re-check every 60s

  constructor(params: CustomLocalLLMParams = {}) {
    super(params);
    this.baseUrl     = (params.baseUrl    ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    this.model       = params.model       ?? DEFAULT_MODEL;
    this.temperature = params.temperature ?? DEFAULT_TEMP;
    this.maxTokens   = params.maxTokens   ?? DEFAULT_MAX_TOKENS;
    this.timeoutMs   = params.timeoutMs   ?? DEFAULT_TIMEOUT;
    this.maxRetries  = params.maxRetries  ?? MAX_RETRIES;
    this._validateParams();
  }

  _llmType(): string { return 'custom_local_llm'; }

  // ─── Core Inference ────────────────────────────────────────────────────────

  async _generate(
    prompts: string[],
    _options: this['ParsedCallOptions'],
    _runManager?: CallbackManagerForLLMRun
  ): Promise<LLMResult> {
    // ✅ Fast-fail if server is known to be down
    const available = await this._checkServerAvailable();
    if (!available) {
      throw new LocalLLMError(
        'Ollama server is not available. Using rule-based fallback.',
        'NETWORK_ERROR'
      );
    }

    const generations = await Promise.all(
      prompts.map(p => this._generateSingle(p))
    );
    return { generations };
  }

  private async _generateSingle(prompt: string): Promise<Generation[]> {
    const sanitized = this._sanitizePrompt(prompt);
    const text = await this._callWithRetry(sanitized);
    return [{ text }];
  }

  // ─── Server Availability Check (cached) ────────────────────────────────────

  private async _checkServerAvailable(): Promise<boolean> {
    const now = Date.now();
    const cacheValid = (now - CustomLocalLLM._lastCheckedAt) < CustomLocalLLM.CACHE_TTL_MS;

    if (cacheValid && CustomLocalLLM._serverAvailable !== null) {
      return CustomLocalLLM._serverAvailable;
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000); // 2s ping timeout
      const res = await fetch(`${this.baseUrl}/api/tags`, { signal: controller.signal });
      clearTimeout(timer);
      CustomLocalLLM._serverAvailable = res.ok;
    } catch {
      CustomLocalLLM._serverAvailable = false;
    }

    CustomLocalLLM._lastCheckedAt = now;

    if (!CustomLocalLLM._serverAvailable) {
      console.warn('[CustomLocalLLM] ⚠️  Ollama server not reachable at', this.baseUrl);
      console.warn('[CustomLocalLLM] → Rule-based responses will be used instead.');
      console.warn('[CustomLocalLLM] → To enable AI responses: install Ollama + run `ollama pull llama3`');
    } else {
      console.info('[CustomLocalLLM] ✅ Ollama server connected. Model:', this.model);
    }

    return CustomLocalLLM._serverAvailable;
  }

  // ✅ Public method — chains.ts use karta hai
  static async isAvailable(baseUrl?: string): Promise<boolean> {
    const url = (baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${url}/api/tags`, { signal: controller.signal });
      return res.ok;
    } catch {
      return false;
    }
  }

  // ✅ Reset cache — useful for testing
  static resetAvailabilityCache(): void {
    CustomLocalLLM._serverAvailable = null;
    CustomLocalLLM._lastCheckedAt = 0;
  }

  // ─── HTTP Call with Retry ──────────────────────────────────────────────────

  private async _callWithRetry(prompt: string): Promise<string> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this._callOllama(prompt);
      } catch (err) {
        lastError = err;
        const shouldRetry = isTransientError(err) && attempt < this.maxRetries;
        if (shouldRetry) {
          const delay = RETRY_DELAY_BASE * Math.pow(2, attempt);
          console.warn(`[CustomLocalLLM] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
          await sleep(delay);
        } else {
          // ✅ Mark server unavailable on failure so next call fast-fails
          CustomLocalLLM._serverAvailable = false;
          CustomLocalLLM._lastCheckedAt = Date.now();
          break;
        }
      }
    }

    throw lastError instanceof LocalLLMError
      ? lastError
      : new LocalLLMError(
          `LLM call failed: ${(lastError as Error)?.message ?? 'Unknown'}`,
          'NETWORK_ERROR'
        );
  }

  // ─── Raw Ollama HTTP Call ──────────────────────────────────────────────────

  private async _callOllama(prompt: string): Promise<string> {
    const url = `${this.baseUrl}/api/generate`;

    const body: OllamaRequestBody = {
      model: this.model,
      prompt,
      stream: false,
      options: { temperature: this.temperature, num_predict: this.maxTokens },
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let rawResponse: Response;
    try {
      rawResponse = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
        signal:  controller.signal,
      });
    } catch (err: unknown) {
      clearTimeout(timer);
      const msg = (err as Error)?.message ?? '';
      if (msg.includes('abort') || msg.includes('user aborted')) {
        throw new LocalLLMError(`Request timed out after ${this.timeoutMs}ms`, 'TIMEOUT');
      }
      throw new LocalLLMError(`Network error: ${msg}`, 'NETWORK_ERROR');
    } finally {
      clearTimeout(timer);
    }

    let parsed: OllamaResponse;
    try {
      parsed = (await rawResponse.json()) as OllamaResponse;
    } catch {
      throw new LocalLLMError(
        `Invalid JSON from server (status ${rawResponse.status})`,
        'INVALID_RESPONSE',
        rawResponse.status
      );
    }

    if (!rawResponse.ok) {
      const errMsg = isOllamaError(parsed) ? parsed.error : `HTTP ${rawResponse.status}`;
      throw new LocalLLMError(errMsg, 'SERVER_ERROR', rawResponse.status);
    }

    if (isOllamaError(parsed)) {
      throw new LocalLLMError(parsed.error, 'MODEL_ERROR');
    }

    const text = parsed.response?.trim() ?? '';
    if (!text) throw new LocalLLMError('Empty response from model', 'INVALID_RESPONSE');

    return text;
  }

  // ─── Validation ────────────────────────────────────────────────────────────

  private _validateParams(): void {
    if (!this.baseUrl.startsWith('http'))
      throw new Error(`[CustomLocalLLM] Invalid baseUrl: "${this.baseUrl}"`);
    if (!this.model.trim())
      throw new Error('[CustomLocalLLM] model name cannot be empty');
    if (this.temperature < 0 || this.temperature > 2)
      throw new RangeError('[CustomLocalLLM] temperature must be 0–2');
    if (this.maxTokens < 1 || this.maxTokens > 32768)
      throw new RangeError('[CustomLocalLLM] maxTokens must be 1–32768');
    if (this.timeoutMs < 1000)
      throw new RangeError('[CustomLocalLLM] timeoutMs must be >= 1000ms');
  }

  private _sanitizePrompt(prompt: string): string {
    if (typeof prompt !== 'string') throw new TypeError('[CustomLocalLLM] prompt must be a string');
    const trimmed = prompt.trim();
    if (!trimmed) throw new Error('[CustomLocalLLM] prompt cannot be empty');
    const MAX_CHARS = 4000; // ✅ Reduced from 8000 — faster LLM response
    if (trimmed.length > MAX_CHARS) {
      console.warn(`[CustomLocalLLM] Prompt truncated: ${trimmed.length} → ${MAX_CHARS} chars`);
      return trimmed.slice(0, MAX_CHARS);
    }
    return trimmed;
  }

  // ─── Health Check ──────────────────────────────────────────────────────────

  async healthCheck(): Promise<{ ok: boolean; model: string; error?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return { ok: false, model: this.model, error: `HTTP ${res.status}` };
      return { ok: true, model: this.model };
    } catch (err) {
      return { ok: false, model: this.model, error: (err as Error)?.message ?? 'Unknown' };
    }
  }
}