import { QueryIntent, PriceRange, IntentType } from '../types/index.js';

// Category keywords mapping for product classification
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Electronics: [
    'phone', 'mobile', 'smartphone', 'fone', 'phon',
    'iphone', 'samsung', 'oneplus', 'redmi', 'realme', 'vivo', 'oppo', 'poco', 'nokia', 'motorola',
    'laptop', 'notebook', 'macbook', 'chromebook', 'thinkpad', 'pavilion', 'inspiron',
    'headphone', 'headphones', 'earphone', 'earphones', 'earbuds', 'airpods', 'buds',
    'speaker', 'speakers', 'soundbar',
    'tv', 'television', 'monitor', 'screen', 'display',
    'camera', 'dslr', 'gopro', 'webcam',
    'watch', 'smartwatch', 'band', 'fitness band', 'tracker',
    'tablet', 'ipad', 'tab',
    'charger', 'powerbank', 'power bank', 'cable', 'adapter',
    'mouse', 'keyboard', 'gaming', 'controller', 'gamepad',
    'pendrive', 'hard disk', 'ssd', 'memory card',
    'ps5', 'ps4', 'playstation', 'xbox', 'nintendo',
    'hp', 'dell', 'lenovo', 'asus', 'acer', 'msi',
  ],
  Grocery: [
    'rice', 'chawal', 'dal', 'daal', 'atta', 'flour', 'aata',
    'oil', 'tel', 'ghee', 'butter', 'makhan',
    'sugar', 'cheeni', 'salt', 'namak',
    'tea', 'chai', 'coffee',
    'milk', 'doodh', 'paneer', 'cheese', 'curd', 'dahi',
    'biscuit', 'chips', 'namkeen', 'snacks',
    'chocolate', 'candy', 'toffee',
    'noodles', 'maggi', 'pasta',
    'juice', 'water', 'paani',
    'soap', 'shampoo', 'toothpaste', 'cream', 'lotion',
    'masala', 'spice', 'mirch', 'haldi', 'jeera',
  ],
  Toys: [
    'toy', 'toys', 'khilona', 'khilone',
    'doll', 'dolls', 'gudiya', 'barbie',
    'remote car', 'rc car',
    'puzzle', 'puzzles', 'lego', 'blocks', 'building blocks',
    'action figure', 'teddy', 'stuffed',
  ],
  Games: [
    'game', 'games',
    'board game', 'chess', 'carrom', 'ludo',
    'cricket bat', 'football', 'basketball', 'badminton',
    'video game', 'pc game',
  ],
  'Kitchen Appliances': [
    'kitchen', 'rasoi', 'cooking',
    'mixer', 'grinder', 'mixie', 'blender', 'juicer',
    'cooker', 'pressure cooker',
    'induction', 'stove', 'gas',
    'microwave', 'oven', 'otg', 'toaster',
    'fridge', 'refrigerator', 'freezer',
    'chimney', 'exhaust',
    'pan', 'tawa', 'kadhai', 'kadai', 'pot', 'utensil', 'bartan',
    'water purifier', 'ro', 'filter', 'purifier',
    'kettle', 'electric kettle', 'flask',
    'dishwasher', 'washing machine',
  ],
};

const BUDGET_KEYWORDS: string[] = [
  'cheap', 'sasta', 'sastaa', 'saste', 'budget', 'affordable',
  'under', 'below', 'less than', 'tak', 'ke andar', 'ke under', 'se kam',
  'within', 'maximum', 'max', 'upto', 'up to',
];

const QUALITY_KEYWORDS: string[] = [
  'best', 'top', 'premium', 'pro',
  'accha', 'achha', 'badhiya', 'shandar', 'zabardast',
  'highest rated', 'top rated', 'best rated',
  'popular', 'trending', 'recommend', 'suggest',
];

const DETAIL_KEYWORDS: string[] = [
  'detail', 'details', 'about', 'tell me about',
  'batao', 'bata', 'bataiye', 'puri detail', 'full detail',
  'information', 'info', 'jankari',
  'features', 'specification', 'specs',
  'ke baare', 'ke baare mein',
];

const PRICE_QUERY_KEYWORDS: string[] = [
  'price', 'cost', 'kitne', 'kitna', 'kitni',
  'kya hai', 'price kya', 'rate', 'daam', 'dam',
  'wale ki', 'wala ka', 'wali ki',
];

const KNOWN_PRODUCT_TOKENS: string[] = [
  'macbook', 'airpods', 'iphone', 'ipad',
  'samsung', 'oneplus', 'redmi', 'realme',
  'sony', 'lg', 'boat', 'jbl', 'bose', 'sennheiser', 'shure',
  'ps5', 'ps4', 'xbox', 'corsair', 'yamaha',
  'hp', 'dell', 'lenovo', 'asus', 'acer', 'msi',
  'thinkpad', 'pavilion', 'inspiron', 'vivobook',
  'wh-1000xm5', 'm3', 'm2', 'air', 'pro max',
];

const HINGLISH_NOISE_WORDS: Set<string> = new Set([
  'mujhe', 'muje', 'mere', 'mera', 'meri', 'main', 'mai',
  'kuch', 'koi', 'ek', 'do', 'teen', 'char',
  'dikhao', 'dikha', 'batao', 'bata', 'chahiye', 'chahie',
  'hai', 'hain', 'ho', 'tha', 'the', 'thi',
  'ka', 'ke', 'ki', 'ko', 'se', 'me', 'mein', 'par',
  'aur', 'ya', 'bhi', 'to', 'toh', 'na', 'nahi',
  'show', 'want', 'need', 'please', 'a', 'an', 'some',
  'under', 'below', 'above', 'around', 'within',
  'and', 'or', 'with', 'for', 'in', 'on', 'at', 'of',
  'can', 'you', 'my', 'what', 'which', 'how',
  'is', 'are', 'was', 'were', 'will', 'would', 'could',
  'wale', 'wala', 'wali', 'price', 'kya',
]);

class PatternDefinitions {
  static readonly GREETING = /^(hi+|hello+|hey+|helo|hii+|hyy|heyy+|namaste|namaskar|pranam|salaam|salam|sup|yo|good\s*(morning|evening|afternoon|night))\s*[!.?]?\s*$/i;
  static readonly CASUAL = /how\s+are\s+you|kaisa\s+hai|kya\s+haal|aap\s+kaise|kaisi\s+ho|kaise\s+hain|tu\s+kaisa|tum\s+kaise|kaise\s+ho/i;
  static readonly THANKS = /^(thanks|thank\s*you|shukriya|dhanyawad|dhanyavaad|thx|ty|thanku|thnks|bahut\s+accha|bahut\s+acha|acha\s+hai)\s*[!.]?\s*$/i;
  static readonly GOODBYE = /^(bye+|goodbye|alvida|ok\s*bye|cya|tata|baad\s+mein|baad\s+me|nikal|chalo|see\s+you|phir\s+milenge)\s*[!.]?\s*$/i;
  static readonly COMPARISON = /\bvs\b|compare|comparison|difference|better|versus/i;
}

class CategoryDetector {
  detect(query: string): string | undefined {
    const cleanQuery = this.cleanQuery(query);
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        const pattern = new RegExp(`\\b${this.escapeRegex(keyword)}\\b`, 'i');
        if (pattern.test(cleanQuery)) return category;
      }
    }
    return undefined;
  }

  private cleanQuery(query: string): string {
    return query.replace(/[.,!?]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

class KeywordExtractor {
  extract(query: string): string[] {
    const words = query
      .toLowerCase()
      .replace(/[.,!?]/g, ' ')
      .split(/\s+/)
      .filter(word => this.isValidKeyword(word));
    return [...new Set(words)];
  }

  private isValidKeyword(word: string): boolean {
    if (word.length <= 1) return false;
    if (HINGLISH_NOISE_WORDS.has(word)) return false;
    if (/^\d+$/.test(word)) return false;
    return true;
  }
}

class ProductNameExtractor {
  private readonly fillerPatterns: RegExp[] = [
    /mujhe|muje|mere|ki full detail|ki detail|ke baare mein|ke baare|ke specs/gi,
    /batao|bata|bataiye|dikhao|dikha|chahiye|de|do|please/gi,
    /kya hai|about|details?|info|information/gi,
    /ki price|ka price|ke price|kitne ka|kitne ki/gi,
    /price kya hai|kya hai price|wale ki|wala ka|wali ki/gi,
    /best|top|good|accha|badhiya/gi,
  ];

  extract(query: string): string | null {
    let cleaned = query;
    for (const pattern of this.fillerPatterns) {
      cleaned = cleaned.replace(pattern, ' ');
    }
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    if (!cleaned) return null;

    const words = cleaned.split(' ').filter(w => w.length > 0);
    const hasKnownToken = this.containsKnownProduct(query);

    if (hasKnownToken && words.length <= 6) return cleaned;
    if (words.length >= 1 && words.length <= 4) return cleaned;

    return null;
  }

  private containsKnownProduct(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return KNOWN_PRODUCT_TOKENS.some(token => lowerQuery.includes(token.toLowerCase()));
  }
}

class PriceExtractor {
  private readonly pricePatterns: RegExp[] = [
    /(\d+)\s*(ka|ke|ki|mein|me|tak|under|ke andar|ke under)/i,
    /(under|below|less than|upto|up to|within|max|maximum)\s*[₹rs.]*\s*(\d+)/i,
    /(\d+)\s*(k|K|thousand|hazar|hazaar)/i,
    /[₹rs.]+\s*(\d+)/i,
    /(\d{1,3}),(\d{3})/,
    /(\d+)\s*(rupees|rupaye|rupee|rs)/i,
    /\b(\d{4,6})\b/,
  ];

  extract(query: string): { found: boolean; range?: PriceRange; budget?: number } {
    for (const pattern of this.pricePatterns) {
      const match = query.match(pattern);
      if (!match) continue;

      const amount = this.parseAmount(match, pattern);
      if (amount >= 100) {
        return { found: true, range: { min: 0, max: amount }, budget: amount };
      }
    }

    if (this.hasBudgetKeyword(query)) {
      return { found: true, range: { min: 0, max: 15000 }, budget: 15000 };
    }

    return { found: false };
  }

  private parseAmount(match: RegExpMatchArray, pattern: RegExp): number {
    let amount = 0;
    if (pattern.source.includes('k|K|thousand')) {
      amount = parseInt(match[1]) * 1000;
    } else if (pattern.source.includes(',')) {
      amount = parseInt(match[1] + match[2]);
    } else if (match[2] && /^\d+$/.test(match[2])) {
      amount = parseInt(match[2]);
    } else {
      amount = parseInt(match[1]);
    }
    if (amount > 0 && amount < 1000) amount *= 1000;
    return amount;
  }

  private hasBudgetKeyword(query: string): boolean {
    return BUDGET_KEYWORDS.some(kw => query.toLowerCase().includes(kw));
  }
}

class RatingExtractor {
  extract(query: string): number | undefined {
    const lowerQuery = query.toLowerCase();
    if (/5\s*star|five star|top rated|best rated|highest rated/i.test(lowerQuery)) return 4.5;
    if (/4\s*star|four star|4\+|good rated|highly rated/i.test(lowerQuery)) return 4.0;
    if (/popular|trending|famous/i.test(lowerQuery)) return 3.5;
    return undefined;
  }
}

class IntentClassifier {
  classifyAsGreeting(query: string): boolean {
    return PatternDefinitions.GREETING.test(query);
  }

  classifyAsCasual(query: string): boolean {
    return (
      PatternDefinitions.CASUAL.test(query) ||
      PatternDefinitions.THANKS.test(query) ||
      PatternDefinitions.GOODBYE.test(query)
    );
  }

  classifyAsComparison(query: string): boolean {
    return PatternDefinitions.COMPARISON.test(query);
  }

  hasDetailKeyword(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return DETAIL_KEYWORDS.some(kw => lowerQuery.includes(kw));
  }

  hasPriceQueryKeyword(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return PRICE_QUERY_KEYWORDS.some(kw => lowerQuery.includes(kw));
  }

  hasQualityKeyword(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return QUALITY_KEYWORDS.some(kw => lowerQuery.includes(kw));
  }

  hasBudgetKeyword(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return BUDGET_KEYWORDS.some(kw => lowerQuery.includes(kw));
  }
}

export class IntentAgent {
  private readonly categoryDetector: CategoryDetector;
  private readonly keywordExtractor: KeywordExtractor;
  private readonly productNameExtractor: ProductNameExtractor;
  private readonly priceExtractor: PriceExtractor;
  private readonly ratingExtractor: RatingExtractor;
  private readonly intentClassifier: IntentClassifier;

  constructor() {
    this.categoryDetector = new CategoryDetector();
    this.keywordExtractor = new KeywordExtractor();
    this.productNameExtractor = new ProductNameExtractor();
    this.priceExtractor = new PriceExtractor();
    this.ratingExtractor = new RatingExtractor();
    this.intentClassifier = new IntentClassifier();
  }

  async detect(userQuery: string): Promise<QueryIntent> {
    const query = userQuery.toLowerCase().trim();

    const intent: QueryIntent = {
      type: 'general',
      keywords: [],
    };

    if (this.intentClassifier.classifyAsGreeting(query)) {
      return { ...intent, type: 'greeting' };
    }

    if (this.intentClassifier.classifyAsCasual(query)) {
      return { ...intent, type: 'general' };
    }

    intent.category = this.categoryDetector.detect(query);
    intent.keywords = this.keywordExtractor.extract(query);
    intent.rating = this.ratingExtractor.extract(query);

    const priceData = this.priceExtractor.extract(query);
    if (priceData.found) {
      intent.priceRange = priceData.range;
      intent.budget = priceData.budget;
    }

    const productName = this.productNameExtractor.extract(userQuery);
    intent.type = this.determineIntentType(query, intent, productName);

    // ✅ FIX: productName ko 'product_detail' AUR 'price_query' dono pe attach karo
    if (productName && (intent.type === 'product_detail' || intent.type === 'price_query')) {
      intent.productName = productName;
    }

    return intent;
  }

  private determineIntentType(
    query: string,
    intent: QueryIntent,
    productName: string | null
  ): IntentType {

    // Price query for specific product
    if (productName && this.intentClassifier.hasPriceQueryKeyword(query)) {
      return 'product_detail';
    }

    // Explicit detail request
    if (this.intentClassifier.hasDetailKeyword(query)) {
      return 'product_detail';
    }

    // Comparison request
    if (this.intentClassifier.classifyAsComparison(query)) {
      return 'comparison';
    }

    // Quality/recommendation request
    if (this.intentClassifier.hasQualityKeyword(query)) {
      return 'recommendation';
    }

    // Budget/price constrained search
    if (this.intentClassifier.hasBudgetKeyword(query) || intent.priceRange || intent.budget) {
      return 'price_query';
    }

    // Category or keyword based search
    if (intent.category || (intent.keywords && intent.keywords.length > 0)) {
      return 'product_search';
    }

    return 'general';
  }

  detectCategory(query: string): string | undefined {
    return this.categoryDetector.detect(query);
  }

  extractKeywords(query: string): string[] {
    return this.keywordExtractor.extract(query);
  }

  extractProductName(query: string): string | null {
    return this.productNameExtractor.extract(query);
  }

  extractPrice(query: string): { found: boolean; range?: PriceRange; budget?: number } {
    return this.priceExtractor.extract(query);
  }

  extractRating(query: string): number | undefined {
    return this.ratingExtractor.extract(query);
  }
}

const intentAgentInstance = new IntentAgent();

export async function detectIntent(userQuery: string): Promise<QueryIntent> {
  return intentAgentInstance.detect(userQuery);
}