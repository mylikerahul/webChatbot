import { Product, QueryIntent } from '../types/index.js';

// Response templates for different scenarios
interface ResponseTemplate {
  prefix: string[];
  suffix: string[];
}

// Product feature extractor
class ProductFeatureExtractor {
  extractFeatures(product: Product): string[] {
    const features: string[] = [];

    if (product.rating && product.rating >= 4.0) {
      features.push(`${product.rating} star rating`);
    }

    if (product.description) {
      const descWords = product.description.split(' ').slice(0, 15).join(' ');
      features.push(descWords);
    }

    return features;
  }

  formatPrice(price: number): string {
    return `Rs.${price.toLocaleString('en-IN')}`;
  }

  getRatingText(rating: number | undefined): string {
    if (!rating) return '';
    if (rating >= 4.5) return 'excellent rating';
    if (rating >= 4.0) return 'great rating';
    if (rating >= 3.5) return 'good rating';
    return 'decent rating';
  }
}

// Response template manager
class ResponseTemplateManager {
  private readonly noProductTemplates: string[] = [
    'Is query ke liye abhi koi exact match nahi mila. Thoda alag keyword try karo!',
    'Hmm, yeh product filhaal available nahi hai. Kuch aur try karein?',
    'Is naam se product nahi mila. Spelling check karo ya category batao.',
  ];

  getTemplate(intentType: string): ResponseTemplate {
    switch (intentType) {
      case 'price_query':
      case 'product_detail':
        return this.detailTemplates;
      case 'recommendation':
        return this.recommendationTemplates;
      case 'product_search':
        return this.searchTemplates;
      default:
        return this.searchTemplates;
    }
  }

  getNoProductResponse(): string {
    return this.pickRandom(this.noProductTemplates);
  }

  pickRandom(arr: string[]): string {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private readonly detailTemplates: ResponseTemplate = {
    prefix: [
      'Yeh rahi complete detail:',
      'Iske baare mein puri jankari:',
      'Product ki specifications:',
      'Aapka selected product:',
    ],
    suffix: [
      'Kaisa laga? Cart mein daalein?',
      'Isse milte julte products bhi hain, dekhoge?',
      'Yeh product best seller hai apni category mein!',
    ],
  };

  private readonly recommendationTemplates: ResponseTemplate = {
    prefix: [
      'Aapki pasand ke hisaab se best options:',
      'Maine aapke liye best products dhundhe hain:',
      'Top rated products yeh rahe:',
      'Yeh products sabse zyada popular hain:',
    ],
    suffix: [
      'Inn mein se koi pasand aaye toh batao!',
      'Kisi ki detail chahiye toh product ka naam batao.',
      'Budget batao toh aur filter kar doon.',
    ],
  };

  private readonly searchTemplates: ResponseTemplate = {
    prefix: [
      'Yeh rahe aapke liye products:',
      'Maine yeh dhundhe aapke liye:',
      'Dekho yeh options mil rahe hain:',
      'Aapki search ke results:',
    ],
    suffix: [
      'Koi specific product ki detail chahiye?',
      'Price range adjust karni ho toh batao.',
      'Kisi aur category mein dekhna hai?',
    ],
  };
}

// Single product response builder
class SingleProductResponseBuilder {
  private readonly featureExtractor: ProductFeatureExtractor;

  constructor() {
    this.featureExtractor = new ProductFeatureExtractor();
  }

  build(product: Product, query: string): string {
    const lines: string[] = [];

    lines.push(`**${product.name}**`);
    lines.push(`Price: ${this.featureExtractor.formatPrice(product.price)}`);

    if (product.rating) {
      const ratingText = this.featureExtractor.getRatingText(product.rating);
      lines.push(`Rating: ${product.rating}/5 (${ratingText})`);
    }

    if (product.category) {
      lines.push(`Category: ${product.category}`);
    }

    if (product.description) {
      lines.push(`\nDescription: ${product.description}`);
    }

    lines.push(this.getValueAssessment(product));

    return lines.join('\n');
  }

  private getValueAssessment(product: Product): string {
    const price = product.price;
    const rating = product.rating || 0;

    if (rating >= 4.5 && price < 50000) return '\nYeh product value for money hai!';
    if (rating >= 4.0) return '\nCustomers ne isko achha rating diya hai.';
    if (price < 20000) return '\nBudget friendly option hai yeh.';
    return '\nYeh premium category mein aata hai.';
  }
}

// Multiple products response builder
class MultipleProductsResponseBuilder {
  private readonly featureExtractor: ProductFeatureExtractor;

  constructor() {
    this.featureExtractor = new ProductFeatureExtractor();
  }

  build(products: Product[], maxProducts: number = 5): string {
    const lines: string[] = [];
    const displayProducts = products.slice(0, maxProducts);

    displayProducts.forEach((product, index) => {
      const priceStr = this.featureExtractor.formatPrice(product.price);
      const ratingStr = product.rating ? ` | ${product.rating} stars` : '';

      lines.push(`${index + 1}. **${product.name}**`);
      lines.push(`   Price: ${priceStr}${ratingStr}`);

      if (product.description) {
        const shortDesc = product.description.split(' ').slice(0, 10).join(' ');
        lines.push(`   ${shortDesc}...`);
      }
      lines.push('');
    });

    const bestPick = this.findBestPick(displayProducts);
    if (bestPick && displayProducts.length > 1) {
      lines.push(`Meri recommendation: **${bestPick.name}** - best value for money!`);
    }

    return lines.join('\n');
  }

  private findBestPick(products: Product[]): Product | null {
    if (products.length === 0) return null;

    const sorted = [...products].sort((a, b) => {
      const scoreA = (a.rating || 3) / (a.price / 10000);
      const scoreB = (b.rating || 3) / (b.price / 10000);
      return scoreB - scoreA;
    });

    return sorted[0];
  }
}

// Context analyzer
class QueryContextAnalyzer {
  isPriceQuery(query: string): boolean {
    return /price|kitne|kitna|kya hai|cost|daam|rate/i.test(query);
  }

  isComparisonQuery(query: string): boolean {
    return /vs|compare|better|versus|difference/i.test(query);
  }

  isBudgetQuery(query: string): boolean {
    return /under|budget|sasta|cheap|affordable|below/i.test(query);
  }

  isDetailQuery(query: string): boolean {
    return /detail|features|specs|batao|about|information/i.test(query);
  }

  extractProductMention(query: string): string | null {
    const cleanQuery = query
      .replace(/ki price|ka price|kya hai|kitne|batao|dikhao|chahiye/gi, '')
      .replace(/wale|wala|wali/gi, '')
      .trim();

    if (cleanQuery.length > 2) return cleanQuery;
    return null;
  }
}

// Main Reasoning Agent
export class ReasoningAgent {
  private readonly templateManager: ResponseTemplateManager;
  private readonly singleProductBuilder: SingleProductResponseBuilder;
  private readonly multipleProductsBuilder: MultipleProductsResponseBuilder;
  private readonly contextAnalyzer: QueryContextAnalyzer;

  constructor() {
    this.templateManager = new ResponseTemplateManager();
    this.singleProductBuilder = new SingleProductResponseBuilder();
    this.multipleProductsBuilder = new MultipleProductsResponseBuilder();
    this.contextAnalyzer = new QueryContextAnalyzer();
  }

  async generate(query: string, products: Product[], intent?: QueryIntent): Promise<string> {
    if (!products || products.length === 0) {
      return this.generateNoProductResponse(query);
    }

    const responseType = this.determineResponseType(query, products);

    switch (responseType) {
      case 'single_detail':
        return this.generateSingleProductResponse(query, products[0]);
      case 'price_answer':
        return this.generatePriceResponse(query, products[0]);
      case 'multiple_list':
        return this.generateMultipleProductResponse(query, products, intent);
      case 'recommendation':
        return this.generateRecommendationResponse(query, products);
      default:
        return this.generateMultipleProductResponse(query, products, intent);
    }
  }

  private determineResponseType(query: string, products: Product[]): string {
    if (products.length === 1) {
      if (this.contextAnalyzer.isPriceQuery(query)) return 'price_answer';
      return 'single_detail';
    }

    if (this.contextAnalyzer.isDetailQuery(query)) return 'single_detail';

    if (/best|top|recommend|suggest|accha|badhiya/i.test(query)) return 'recommendation';

    return 'multiple_list';
  }

  private generateNoProductResponse(query: string): string {
    const mention = this.contextAnalyzer.extractProductMention(query);
    if (mention) {
      return `"${mention}" ke liye koi exact match nahi mila. Thoda different keyword try karo ya category batao.`;
    }
    return this.templateManager.getNoProductResponse();
  }

  private generateSingleProductResponse(query: string, product: Product): string {
    const prefixes = [
      'Yeh rahi complete detail:',
      'Iske baare mein puri jankari:',
      'Aapka product:',
    ];
    const prefix = this.templateManager.pickRandom(prefixes);
    const productDetail = this.singleProductBuilder.build(product, query);
    const suffixes = [
      '\n\nKaisa laga? Cart mein add karein?',
      '\n\nYeh achha choice hai! Lena hai?',
      '\n\nIsse related aur options dekhne hain?',
    ];
    const suffix = this.templateManager.pickRandom(suffixes);
    return `${prefix}\n\n${productDetail}${suffix}`;
  }

  private generatePriceResponse(query: string, product: Product): string {
    const price = `Rs.${product.price.toLocaleString('en-IN')}`;

    const responses = [
      `**${product.name}** ki price hai **${price}**`,
      `Haan! **${product.name}** ka daam hai **${price}**`,
      `**${product.name}**: **${price}** mein mil jayega`,
    ];

    let response = this.templateManager.pickRandom(responses);

    if (product.rating) {
      response += ` | Rating: ${product.rating}/5`;
    }

    if (product.rating && product.rating >= 4.0) {
      response += '\n\nYeh product customers mein kaafi popular hai!';
    } else if (product.price < 30000) {
      response += '\n\nBudget friendly option hai yeh.';
    }

    response += '\n\nCart mein add karna ho toh batao!';
    return response;
  }

  private generateMultipleProductResponse(
    query: string,
    products: Product[],
    intent?: QueryIntent
  ): string {
    const prefixes = [
      'Yeh rahe aapke liye best options:',
      'Maine yeh dhundhe aapke liye:',
      'Dekho yeh products mil rahe hain:',
    ];
    const prefix = this.templateManager.pickRandom(prefixes);
    const productList = this.multipleProductsBuilder.build(products, 5);

    let suffix = '\n\nKisi product ki detail chahiye toh naam batao!';
    if (intent?.budget) {
      suffix = `\n\nYeh sab Rs.${intent.budget.toLocaleString('en-IN')} ke under hain. Koi pasand aaya?`;
    }

    return `${prefix}\n\n${productList}${suffix}`;
  }

  private generateRecommendationResponse(query: string, products: Product[]): string {
    const prefixes = [
      'Aapki pasand ke hisaab se best options:',
      'Top rated products yeh rahe:',
      'Maine best picks nikale hain aapke liye:',
      'Yeh products sabse zyada popular hain:',
    ];
    const prefix = this.templateManager.pickRandom(prefixes);
    const productList = this.multipleProductsBuilder.build(products, 5);
    const suffixes = [
      '\n\nMeri top pick pehla wala hai - best value!',
      '\n\nInn mein se koi pasand aaye toh detail pooch lo.',
      '\n\nSab verified products hain with good ratings.',
    ];
    const suffix = this.templateManager.pickRandom(suffixes);
    return `${prefix}\n\n${productList}${suffix}`;
  }
}

// Singleton instance
const reasoningAgentInstance = new ReasoningAgent();

// ✅ FIX 1: generateResponse — original export (unchanged)
export function generateResponse(
  query: string,
  products: Product[],
  intent?: QueryIntent
): Promise<string> {
  return reasoningAgentInstance.generate(query, products, intent);
}

// ✅ FIX 2: generateLocalResponse — workflow.ts import karta tha, ab exist karta hai
export async function generateLocalResponse(
  query: string,
  products: Product[],
  intent?: QueryIntent
): Promise<string> {
  return reasoningAgentInstance.generate(query, products, intent);
}

// ✅ FIX 3: generateProductDetailResponse — workflow.ts import karta tha, ab exist karta hai
export async function generateProductDetailResponse(
  product: Product,
  query: string
): Promise<string> {
  const contextAnalyzer = new QueryContextAnalyzer();
  const featureExtractor = new ProductFeatureExtractor();
  const singleBuilder = new SingleProductResponseBuilder();

  // Price-specific short response
  if (contextAnalyzer.isPriceQuery(query)) {
    const price = featureExtractor.formatPrice(product.price);
    let response = `**${product.name}** ki price hai **${price}**`;

    if (product.rating) {
      response += ` | ⭐ ${product.rating}/5`;
    }

    if (product.rating && product.rating >= 4.0) {
      response += '\n\nYeh product customers mein kaafi popular hai!';
    } else if (product.price < 30000) {
      response += '\n\nBudget friendly option hai yeh.';
    }

    response += '\n\nCart mein add karna ho toh batao!';
    return response;
  }

  // Full detail response
  const detail = singleBuilder.build(product, query);
  return `Yeh rahi complete detail:\n\n${detail}\n\nKaisa laga? Cart mein add karein?`;
}