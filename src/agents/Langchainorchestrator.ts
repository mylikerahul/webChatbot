import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { CustomLocalLLM } from './customLocalLLM.js';
import { Product, QueryIntent } from '../types/index.js';

const MAX_PRODUCTS_IN_LIST = 10;
const MAX_PRODUCTS_DISPLAYED = 5;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 300;

const HINGLISH_PATTERN = /mujhe|dikhao|batao|chahiye|karo|hai|nahi|aur|wala|wali/i;

type ChainType = 'list' | 'detail';
type InvokePayload = Record<string, string>;

interface SerializedProduct {
  name: string;
  title: string;
  price: number;
  rating: number | null;
  category: string;
  description?: string | null;
  stock?: number | null;
}

class Timer {
  static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

class ProductValidator {
  static isValid(p: unknown): p is Product {
    if (!p || typeof p !== 'object') return false;
    const obj = p as Record<string, unknown>;
    return (
      typeof obj['name'] === 'string' &&
      obj['name'].trim().length > 0 &&
      typeof obj['price'] === 'number' &&
      isFinite(obj['price']) &&
      obj['price'] >= 0
    );
  }
}

class PriceFormatter {
  static format(price: number): string {
    if (!isFinite(price) || price < 0) return 'Price unavailable';
    return `Rs.${price.toLocaleString('en-IN')}`;
  }
}

class RatingFormatter {
  static format(rating: number | null | undefined): string {
    if (rating == null || !isFinite(rating)) return 'Not rated';
    const clamped = Math.min(5, Math.max(0, rating));
    return `${clamped.toFixed(1)}/5`;
  }
}

class ProductSerializer {
  static single(product: Product): string {
    const data: SerializedProduct = {
      name: product.name,
      title: product.title || product.name,
      price: product.price,
      rating: product.rating ?? null,
      category: product.category,
      description: product.description,
      stock: product.stock,
    };
    return JSON.stringify(data);
  }

  static many(products: Product[]): string {
    return JSON.stringify(
      products.map((p) => ({
        name: p.name,
        title: p.title || p.name,
        price: p.price,
        rating: p.rating ?? null,
        category: p.category,
      }))
    );
  }
}

class PromptBuilder {
  static build(type: ChainType): string {
    if (type === 'detail') {
      return `System: You are a helpful AI shopping assistant. Be concise, friendly, and accurate.

User Query: {query}
Product Details: {product}

Provide a helpful product detail response in the same language as the query:`;
    }

    return `System: You are a helpful AI shopping assistant. Be concise, friendly, and accurate.

User Query: {query}
Available Products (JSON): {products}

List the top products with price and rating. Match the language of the query:`;
  }
}

class FallbackResponseBuilder {
  buildDetail(product: Product): string {
    const lines = [
      `${product.title || product.name}`,
      '',
      `Price   : ${PriceFormatter.format(product.price)}`,
      `Rating  : ${RatingFormatter.format(product.rating)}`,
      `Category: ${product.category || 'N/A'}`,
      `Stock   : ${(product.stock ?? 0) > 0 ? `In Stock (${product.stock} units)` : 'Out of Stock'}`,
      '',
      product.description?.trim() || 'Great product for your needs.',
      '',
      'Cart mein add karna hai?',
    ];
    return lines.join('\n');
  }

  buildList(products: Product[]): string {
    const shown = products.slice(0, MAX_PRODUCTS_DISPLAYED);
    const remaining = products.length - shown.length;

    const items = shown.map((p, idx) => {
      const price = PriceFormatter.format(p.price);
      const rating = RatingFormatter.format(p.rating);
      return `${idx + 1}. ${p.title || p.name}\n   ${price} | ${rating} | ${p.category || 'N/A'}`;
    });

    return [
      `${products.length} product${products.length !== 1 ? 's' : ''} mile:`,
      '',
      ...items,
      ...(remaining > 0 ? [`\n...aur ${remaining} products available hain.`] : []),
      '\nKisi specific product ki detail chahiye toh naam batao.',
    ].join('\n');
  }

  buildNoResults(query: string): string {
    return HINGLISH_PATTERN.test(query)
      ? 'Is query ke liye koi product nahi mila. Alag keywords ya budget try karein.'
      : 'No products found. Try different keywords or adjust your budget.';
  }
}

class ChainInvoker {
  private readonly chain: ReturnType<PromptTemplate['pipe']>;
  private readonly fallbackBuilder: FallbackResponseBuilder;

  constructor(
    chain: ReturnType<PromptTemplate['pipe']>,
    fallbackBuilder: FallbackResponseBuilder
  ) {
    this.chain = chain;
    this.fallbackBuilder = fallbackBuilder;
  }

  async invoke(payload: InvokePayload, fallback: () => string): Promise<string> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await (this.chain as any).invoke(payload);
        const trimmed = (result ?? '').trim();
        if (trimmed.length > 0) return trimmed;
        return fallback();
      } catch (err) {
        lastError = err;
        if (attempt < MAX_RETRIES) {
          await Timer.sleep(RETRY_DELAY_MS * (attempt + 1));
        }
      }
    }

    void lastError;
    return fallback();
  }
}

class ChainFactory {
  static build(llm: CustomLocalLLM, type: ChainType): ReturnType<PromptTemplate['pipe']> {
    const template = PromptBuilder.build(type);
    const prompt = PromptTemplate.fromTemplate(template);
    return prompt.pipe(llm).pipe(new StringOutputParser());
  }
}

export class LangChainOrchestrator {
  private readonly listInvoker: ChainInvoker;
  private readonly detailInvoker: ChainInvoker;
  private readonly fallbackBuilder: FallbackResponseBuilder;

  constructor() {
    const llm = new CustomLocalLLM({ temperature: 0.7 });
    this.fallbackBuilder = new FallbackResponseBuilder();
    this.listInvoker = new ChainInvoker(ChainFactory.build(llm, 'list'), this.fallbackBuilder);
    this.detailInvoker = new ChainInvoker(ChainFactory.build(llm, 'detail'), this.fallbackBuilder);
  }

  async generate(
    userQuery: string,
    products: Product[],
    intent?: QueryIntent
  ): Promise<string> {
    if (!userQuery || typeof userQuery !== 'string' || userQuery.trim().length === 0) {
      return this.fallbackBuilder.buildNoResults('');
    }

    const validProducts = (products ?? []).filter(ProductValidator.isValid);

    if (validProducts.length === 0) {
      return this.fallbackBuilder.buildNoResults(userQuery);
    }

    const isSingleDetail =
      validProducts.length === 1 && intent?.type === 'product_detail';

    return isSingleDetail
      ? this.generateDetail(userQuery, validProducts[0])
      : this.generateList(userQuery, validProducts);
  }

  private async generateDetail(query: string, product: Product): Promise<string> {
    return this.detailInvoker.invoke(
      { query, product: ProductSerializer.single(product) },
      () => this.fallbackBuilder.buildDetail(product)
    );
  }

  private async generateList(query: string, products: Product[]): Promise<string> {
    const limited = products.slice(0, MAX_PRODUCTS_IN_LIST);
    return this.listInvoker.invoke(
      { query, products: ProductSerializer.many(limited) },
      () => this.fallbackBuilder.buildList(products)
    );
  }

  formatDetailFallback(product: Product): string {
    return this.fallbackBuilder.buildDetail(product);
  }

  formatListFallback(products: Product[]): string {
    return this.fallbackBuilder.buildList(products);
  }
}