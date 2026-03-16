import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { log } from '../utils/logger.js';
import { langChainOrchestrator } from '../langchain/index.js';
import { handleCommonQuery } from '../agents/commonQueryHandler.js';
import { Product } from '../types/index.js';

interface ChatRequestBody {
  message: string;
  sessionId?: string;
}

interface FormattedProduct {
  price: number;
  mrp?: number;
  rating?: number;
  stock: number;
  image: string | null;
  [key: string]: unknown;
}

class NumberCoercer {
  static toFloat(value: unknown, fallback: number): number {
    if (typeof value === 'number' && isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isFinite(parsed) ? parsed : fallback;
    }
    return fallback;
  }

  static toInt(value: unknown, fallback: number): number {
    if (typeof value === 'number' && isFinite(value)) return Math.floor(value);
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isFinite(parsed) ? parsed : fallback;
    }
    return fallback;
  }
}

class ProductFormatter {
  format(product: Product): FormattedProduct {
    const p = product as unknown as Record<string, unknown>;
    return {
      ...p,
      price: NumberCoercer.toFloat(p['price'], 0),
      mrp: p['mrp'] != null ? NumberCoercer.toFloat(p['mrp'], 0) : undefined,
      rating: p['rating'] != null ? NumberCoercer.toFloat(p['rating'], 0) : undefined,
      stock: NumberCoercer.toInt(p['stock'], 0),
      image: (p['image'] ?? p['image_url'] ?? null) as string | null,
    };
  }

  formatMany(products: Product[]): FormattedProduct[] {
    return products.map((p) => this.format(p));
  }
}

class RequestValidator {
  validate(body: Partial<ChatRequestBody>): string | null {
    const { message } = body;
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return 'Message is required';
    }
    return null;
  }
}

class ChatHandler {
  private readonly formatter: ProductFormatter;
  private readonly validator: RequestValidator;

  constructor() {
    this.formatter = new ProductFormatter();
    this.validator = new RequestValidator();
  }

  async handle(
    request: FastifyRequest<{ Body: ChatRequestBody }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    const { message, sessionId = 'user_123' } = request.body ?? {};

    const validationError = this.validator.validate({ message });
    if (validationError) {
      return reply.code(400).send({
        success: false,
        error: validationError,
        response: null,
        products: [],
      });
    }

    const trimmedMessage = message.trim();
    log.user(`User [${sessionId}]: ${trimmedMessage}`);

    const commonResponse = handleCommonQuery(trimmedMessage);
    if (commonResponse) {
      log.success('Common query handled');
      return reply.send({
        success: true,
        response: commonResponse,
        products: [],
        metadata: {
          type: 'greeting',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const result = await langChainOrchestrator.processChatWithLangChain(
      trimmedMessage,
      sessionId
    );

    const rawProducts: Product[] = Array.isArray(result.products) ? result.products : [];
    const formattedProducts = this.formatter.formatMany(rawProducts);

    log.success(`Returning ${formattedProducts.length} products`);

    return reply.send({
      success: true,
      response: result.response ?? '',
      products: formattedProducts,
      metadata: {
        ...result.metadata,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

class ErrorHandler {
  handle(error: unknown, reply: FastifyReply): FastifyReply {
    const errMsg = error instanceof Error ? error.message : String(error);
    log.error('Chat API error:', errMsg);

    return reply.code(500).send({
      success: false,
      error: 'Failed to process message',
      response: 'Sorry, kuch gadbad ho gayi! Thodi der baad try karo.',
      products: [],
    });
  }
}

export async function chatRoutes(fastify: FastifyInstance): Promise<void> {
  const chatHandler = new ChatHandler();
  const errorHandler = new ErrorHandler();

  fastify.post<{ Body: ChatRequestBody }>('/api/chat', async (request, reply) => {
    try {
      return await chatHandler.handle(request, reply);
    } catch (error: unknown) {
      return errorHandler.handle(error, reply);
    }
  });
}