import { detectIntent } from '../agents/intentAgent.js';
import { ProductTools } from '../tools/productTools.js';
import { LangChainOrchestrator } from './chains.js'; // ✅ FIX: agents/ se nahi, ./chains.js se import
import { QueryIntent, Product } from '../types/index.js';

const MAX_SEARCH_RESULTS = 10;
const MAX_FALLBACK_RESULTS = 5;
const FALLBACK_KEYWORDS_LIMIT = 3;

export interface ChatResult {
  response: string;
  products: Product[];
  metadata: {
    type: string;
    intent?: QueryIntent;
    productCount?: number;
    error?: string;
  };
}

class MessageSanitizer {
  static sanitize(msg: unknown): string {
    if (typeof msg !== 'string') return '';
    return msg.trim().slice(0, 2000);
  }
}

class SessionSanitizer {
  static sanitize(id: unknown): string {
    if (typeof id !== 'string') return 'anonymous';
    return id.trim().replace(/[^a-zA-Z0-9_-]/g, '') || 'anonymous';
  }
}

class ChatResultBuilder {
  static empty(response: string, type: string, intent?: QueryIntent): ChatResult {
    return { response, products: [], metadata: { type, intent } };
  }

  static withProducts(
    response: string,
    products: Product[],
    type: string,
    intent: QueryIntent
  ): ChatResult {
    return { response, products, metadata: { type, intent, productCount: products.length } };
  }

  static error(response: string, type: string, error: unknown, intent?: QueryIntent): ChatResult {
    const errorMsg = error instanceof Error ? error.message : String(error ?? 'Unknown error');
    return { response, products: [], metadata: { type, intent, error: errorMsg } };
  }
}

class ProductDetailHandler {
  constructor(
    private readonly productTools: ProductTools,
    private readonly orchestrator: LangChainOrchestrator
  ) {}

  async handle(message: string, intent: QueryIntent): Promise<ChatResult> {
    const productName = this.resolveProductName(intent);

    if (!productName) {
      return ChatResultBuilder.empty(
        'Konsa product chahiye? Naam clearly batao.',
        'product_detail',
        intent
      );
    }

    let product: Product | null = null;

    try {
      product = await this.productTools.getProductByName(productName);
    } catch {
      // fall through to fallback search
    }

    if (product) {
      const response = await this.orchestrator.generate(message, [product], intent);
      return ChatResultBuilder.withProducts(response, [product], 'product_detail', intent);
    }

    return this.handleFallback(message, intent, productName);
  }

  private async handleFallback(
    message: string,
    intent: QueryIntent,
    productName: string
  ): Promise<ChatResult> {
    const searchIntent: QueryIntent = {
      ...intent,
      type: 'product_search',
      keywords: [
        productName,
        ...((intent.keywords ?? [])
          .filter((k) => k !== productName)
          .slice(0, FALLBACK_KEYWORDS_LIMIT)),
      ],
    };

    let fallbackProducts: Product[] = [];

    try {
      fallbackProducts = await this.productTools.searchProducts(searchIntent);
    } catch (err) {
      return ChatResultBuilder.error(
        `"${productName}" nahi mila aur search bhi fail ho gaya. Baad mein try karo.`,
        'detail_fallback_error',
        err,
        intent
      );
    }

    if (fallbackProducts.length === 0) {
      return ChatResultBuilder.empty(
        `"${productName}" nahi mila. Kuch aur keywords try karo.`,
        'product_detail_not_found',
        intent
      );
    }

    const response = await this.orchestrator.generate(message, fallbackProducts, searchIntent);
    return {
      response: `"${productName}" exact match nahi mila, par yeh similar options hain:\n\n${response}`,
      products: fallbackProducts.slice(0, MAX_FALLBACK_RESULTS),
      metadata: { type: 'product_search_fallback', intent, productCount: fallbackProducts.length },
    };
  }

  private resolveProductName(intent: QueryIntent): string {
    // ✅ FIX: productName pehle, phir saare keywords join, phir pehla keyword
    const fromProductName = intent.productName?.trim();
    if (fromProductName) return fromProductName;

    const keywords = intent.keywords ?? [];
    // Saare meaningful keywords join karo (single token brands ke liye)
    const joined = keywords.join(' ').trim();
    if (joined.length > 0) return joined;

    return '';
  }
}

class ProductSearchHandler {
  constructor(
    private readonly productTools: ProductTools,
    private readonly orchestrator: LangChainOrchestrator
  ) {}

  async handle(message: string, intent: QueryIntent): Promise<ChatResult> {
    let products: Product[] = [];

    try {
      products = await this.productTools.searchProducts(intent);
    } catch (err) {
      return ChatResultBuilder.error(
        'Products search karte waqt error aa gaya. Thodi der baad try karo.',
        'search_error',
        err,
        intent
      );
    }

    if (products.length === 0) {
      // ✅ FIX: category se top rated try karo before giving up
      if (intent.category) {
        try {
          products = await this.productTools.getTopRatedProducts(intent.category, 5);
        } catch {
          // ignore
        }
      }
    }

    if (products.length === 0) {
      return ChatResultBuilder.empty(
        'Koi product nahi mila. Different keywords ya budget try karein.',
        intent.type,
        intent
      );
    }

    const response = await this.orchestrator.generate(message, products, intent);
    return ChatResultBuilder.withProducts(
      response,
      products.slice(0, MAX_SEARCH_RESULTS),
      intent.type,
      intent
    );
  }
}

class ComparisonHandler {
  handle(intent: QueryIntent): ChatResult {
    return ChatResultBuilder.empty(
      'Comparison feature jaldi aa raha hai! Abhi ke liye ek ek product search karke dekho.',
      'comparison',
      intent
    );
  }
}

class GeneralHandler {
  handle(intent: QueryIntent): ChatResult {
    return ChatResultBuilder.empty(
      'Kya dhundh rahe ho? Product naam, category, ya budget batao.',
      'general',
      intent
    );
  }
}

class IntentRouter {
  constructor(
    private readonly detailHandler: ProductDetailHandler,
    private readonly searchHandler: ProductSearchHandler,
    private readonly comparisonHandler: ComparisonHandler,
    private readonly generalHandler: GeneralHandler
  ) {}

  async route(message: string, intent: QueryIntent): Promise<ChatResult> {
    switch (intent.type) {
      case 'product_detail':
        return this.detailHandler.handle(message, intent);

      case 'product_search':
      case 'recommendation':
      case 'price_query':
        return this.searchHandler.handle(message, intent);

      case 'comparison':
        return this.comparisonHandler.handle(intent);

      default:
        return this.generalHandler.handle(intent);
    }
  }
}

class LangChainOrchestratorService {
  private readonly router: IntentRouter;

  constructor() {
    const productTools = new ProductTools();
    const orchestrator = new LangChainOrchestrator(); // ✅ Ab chains.js se aayega

    this.router = new IntentRouter(
      new ProductDetailHandler(productTools, orchestrator),
      new ProductSearchHandler(productTools, orchestrator),
      new ComparisonHandler(),
      new GeneralHandler()
    );
  }

  async processChatWithLangChain(
    rawMessage: unknown,
    rawSessionId: unknown
  ): Promise<ChatResult> {
    const message = MessageSanitizer.sanitize(rawMessage);
    void rawSessionId && SessionSanitizer.sanitize(rawSessionId);

    if (!message) {
      return ChatResultBuilder.empty('Kuch toh poocho! Message empty hai.', 'empty_message');
    }

    let intent: QueryIntent;

    try {
      intent = await detectIntent(message);
    } catch (err) {
      return ChatResultBuilder.error(
        'Intent detect karte waqt kuch gadbad hui. Thoda baad try karo.',
        'intent_error',
        err
      );
    }

    if (!intent || typeof intent.type !== 'string') {
      return ChatResultBuilder.error(
        'Query samajh nahi aaya. Thoda alag tarike se likho.',
        'invalid_intent',
        intent
      );
    }

    try {
      return await this.router.route(message, intent);
    } catch (err) {
      return ChatResultBuilder.error(
        'Kuch technical issue aa gaya. Thodi der baad dobara try karo.',
        `handler_error_${intent.type}`,
        err,
        intent
      );
    }
  }
}

export const langChainOrchestrator = new LangChainOrchestratorService();