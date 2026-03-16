import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { CustomLocalLLM } from '../agents/customLocalLLM.js';
import { log } from '../utils/logger.js';
import { Product, QueryIntent } from '../types/index.js';
import { detectIntent } from '../agents/intentAgent.js';

const MAX_PRODUCTS_IN_LIST = 10;
const MAX_PRODUCTS_DISPLAYED = 5;

const HINGLISH_PATTERN = /mujhe|dikhao|batao|chahiye|karo|hai|nahi|aur|wala|wali|kitne|price|kya/i;

// ─── Formatters ───────────────────────────────────────────────────────────────

class PriceFormatter {
  static format(price: number): string {
    if (!isFinite(price) || price < 0) return 'Price unavailable';
    return `Rs.${price.toLocaleString('en-IN')}`;
  }
}

class RatingFormatter {
  static format(rating: number | null | undefined): string {
    if (rating == null || !isFinite(rating)) return 'Not rated';
    return `${Math.min(5, Math.max(0, rating)).toFixed(1)}/5`;
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

// ─── Rule-based Response Builder ─────────────────────────────────────────────

class ResponseBuilder {

  buildDetail(product: Product, query: string): string {
    const isPriceQuery = /price|kitne|kitna|kya hai|cost|daam|rate/i.test(query);

    if (isPriceQuery) {
      let res = `**${product.title || product.name}** ki price hai **${PriceFormatter.format(product.price)}**`;
      if (product.rating) res += ` | ⭐ ${RatingFormatter.format(product.rating)}`;
      if (product.rating && product.rating >= 4.0) {
        res += '\n\nYeh product customers mein kaafi popular hai!';
      } else if (product.price < 30000) {
        res += '\n\nBudget friendly option hai yeh.';
      }
      res += '\n\nCart mein add karna ho toh batao!';
      return res;
    }

    const lines: string[] = [
      `**${product.title || product.name}**`,
      ``,
      `💰 Price   : **${PriceFormatter.format(product.price)}**`,
      `⭐ Rating  : ${RatingFormatter.format(product.rating)}`,
      `📦 Category: ${product.category || 'N/A'}`,
      `🏪 Stock   : ${(product.stock ?? 0) > 0 ? `In Stock (${product.stock} units)` : 'Out of Stock'}`,
    ];

    if (product.description?.trim()) {
      lines.push(``, `📝 ${product.description.trim()}`);
    }

    lines.push(``, `Cart mein add karna hai? Batao! 🛒`);
    return lines.join('\n');
  }

  buildList(products: Product[], intent?: QueryIntent): string {
    const shown = products.slice(0, MAX_PRODUCTS_DISPLAYED);
    const remaining = products.length - shown.length;

    const openings: Record<string, string> = {
      recommendation: `Yeh rahe top rated products aapke liye: 🌟`,
      price_query:    `Budget ke andar yeh options mil rahe hain: 💰`,
      product_search: `Aapki search ke results yeh rahe: 🔍`,
    };
    const opening = openings[intent?.type ?? ''] ?? `Maine yeh products dhundhe aapke liye: 🛍️`;

    const items = shown.map((p, idx) => {
      const price = PriceFormatter.format(p.price);
      const rating = p.rating ? `⭐ ${RatingFormatter.format(p.rating)}` : '';
      return `${idx + 1}. **${p.title || p.name}**\n   💰 ${price} ${rating}`;
    });

    const lines = [opening, '', ...items];

    if (remaining > 0) {
      lines.push(``, `...aur ${remaining} aur products available hain.`);
    }

    const best = this.findBestPick(shown);
    if (best && shown.length > 1) {
      lines.push(``, `🏆 Meri recommendation: **${best.title || best.name}** - best value for money!`);
    }

    if (intent?.budget) {
      lines.push(``, `Yeh sab **${PriceFormatter.format(intent.budget)}** ke under hain. Koi pasand aaya?`);
    } else {
      lines.push(``, `Kisi product ki detail chahiye toh naam batao!`);
    }

    return lines.join('\n');
  }

  buildNoResults(query: string): string {
    const isHinglish = HINGLISH_PATTERN.test(query);
    if (isHinglish) {
      return `Koi product nahi mila. Alag keywords ya budget try karein!\n\nJaise:\n- "laptop under 50000"\n- "best headphones"\n- "samsung phone"`;
    }
    return `No products found. Try different keywords or adjust your budget.`;
  }

  private findBestPick(products: Product[]): Product | null {
    if (products.length === 0) return null;
    return [...products].sort((a, b) => {
      const scoreA = (a.rating || 3) / (a.price / 10000);
      const scoreB = (b.rating || 3) / (b.price / 10000);
      return scoreB - scoreA;
    })[0];
  }
}

// ─── LLM Availability Check (cached) ─────────────────────────────────────────

let llmAvailable: boolean | null = null;

async function checkLLMAvailability(): Promise<boolean> {
  if (llmAvailable !== null) return llmAvailable;
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 2000);
    const res = await fetch(
      `${process.env.LOCAL_LLM_BASE_URL ?? 'http://localhost:11434'}/api/tags`,
      { signal: controller.signal }
    );
    llmAvailable = res.ok;
  } catch {
    llmAvailable = false;
  }
  log.ai(`[LangChain] LLM ${llmAvailable ? '✅ available' : '❌ unavailable — using rule-based responses'}`);
  return llmAvailable;
}

// ─── Main LangChainOrchestrator Class ────────────────────────────────────────

export class LangChainOrchestrator {
  private readonly responseBuilder: ResponseBuilder;
  private llm: CustomLocalLLM | null = null;

  constructor() {
    this.responseBuilder = new ResponseBuilder();
  }

  async generate(
    userQuery: string,
    products: Product[],
    intent?: QueryIntent
  ): Promise<string> {
    if (!userQuery?.trim()) {
      return this.responseBuilder.buildNoResults('');
    }

    const validProducts = (products ?? []).filter(ProductValidator.isValid);

    if (validProducts.length === 0) {
      return this.responseBuilder.buildNoResults(userQuery);
    }

    const isSingleDetail =
      validProducts.length === 1 &&
      (intent?.type === 'product_detail' || intent?.type === 'price_query');

    // Try LLM if available, else rule-based
    const isLLMUp = await checkLLMAvailability();

    if (isLLMUp) {
      try {
        const llm = this.getLLM();
        if (isSingleDetail) {
          return await this.generateWithLLM_Detail(llm, userQuery, validProducts[0]);
        } else {
          return await this.generateWithLLM_List(llm, userQuery, validProducts);
        }
      } catch (err) {
        log.error('[LangChain] LLM failed, using rule-based fallback');
        llmAvailable = false;
      }
    }

    // ✅ Always-working rule-based fallback
    return isSingleDetail
      ? this.responseBuilder.buildDetail(validProducts[0], userQuery)
      : this.responseBuilder.buildList(validProducts, intent);
  }

  private getLLM(): CustomLocalLLM {
    if (!this.llm) this.llm = new CustomLocalLLM({ temperature: 0.7 });
    return this.llm;
  }

  private async generateWithLLM_Detail(llm: CustomLocalLLM, query: string, product: Product): Promise<string> {
    const prompt = PromptTemplate.fromTemplate(
      `You are a helpful shopping assistant. Answer in the same language as the query.\nQuery: {query}\nProduct: {product}\nGive a short friendly response with price and key details:`
    );
    const chain = prompt.pipe(llm).pipe(new StringOutputParser());
    const result = await (chain as any).invoke({
      query,
      product: JSON.stringify({ name: product.name, price: product.price, rating: product.rating, category: product.category, description: product.description, stock: product.stock }),
    });
    const trimmed = result?.trim();
    if (!trimmed) throw new Error('Empty LLM response');
    return trimmed;
  }

  private async generateWithLLM_List(llm: CustomLocalLLM, query: string, products: Product[]): Promise<string> {
    const prompt = PromptTemplate.fromTemplate(
      `You are a helpful shopping assistant. Answer in the same language as the query.\nQuery: {query}\nProducts: {products}\nList top products with name, price and rating. Be concise and friendly:`
    );
    const chain = prompt.pipe(llm).pipe(new StringOutputParser());
    const result = await (chain as any).invoke({
      query,
      products: JSON.stringify(products.slice(0, MAX_PRODUCTS_IN_LIST).map(p => ({ name: p.name, price: p.price, rating: p.rating, category: p.category }))),
    });
    const trimmed = result?.trim();
    if (!trimmed) throw new Error('Empty LLM response');
    return trimmed;
  }

  formatDetailFallback(product: Product): string {
    return this.responseBuilder.buildDetail(product, '');
  }

  formatListFallback(products: Product[]): string {
    return this.responseBuilder.buildList(products);
  }
}

// ════════════════════════════════════════════════════════════════════════
// CHAIN FUNCTIONS (agents.ts ke liye)
// ════════════════════════════════════════════════════════════════════════

export async function detectIntentWithLangChain(query: string): Promise<QueryIntent> {
  try {
    return await detectIntent(query);
  } catch {
    return { type: 'general', category: undefined, budget: undefined, keywords: query.toLowerCase().split(' ') };
  }
}

const _rb = new ResponseBuilder();

export async function generateRecommendationWithLangChain(query: string, intent: QueryIntent, products: Product[]): Promise<string> {
  if (products.length === 0) return _rb.buildNoResults(query);
  return new LangChainOrchestrator().generate(query, products, intent);
}

export async function generateConversationalResponse(query: string, products: Product[], _history: string): Promise<string> {
  if (products.length === 0) return _rb.buildNoResults(query);
  return new LangChainOrchestrator().generate(query, products);
}

export async function generateSmartFallback(query: string, _intent: QueryIntent): Promise<string> {
  return _rb.buildNoResults(query);
}

// Legacy null exports
export const productRecommendationChain = null;
export const conversationalChain = null;
export const smartFallbackChain = null;