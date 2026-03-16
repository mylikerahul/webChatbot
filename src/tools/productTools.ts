import { pgPool } from '../services/supabase.js';
import { Product, QueryIntent } from '../types/index.js';

const SQL_STOP_WORDS: Set<string> = new Set([
  'best', 'top', 'good', 'nice', 'cheap', 'sasta', 'budget',
  'affordable', 'premium', 'popular', 'trending',
  'recommend', 'suggest', 'max', 'pro',
  'mujhe', 'chahiye', 'dikhao', 'batao', 'please',
  'the', 'a', 'an', 'and', 'or', 'with', 'for',
  'ki', 'ka', 'ke', 'wale', 'wala', 'wali',
]);

const HINGLISH_NOISE: Set<string> = new Set([
  'the', 'a', 'an', 'and', 'or', 'with', 'for',
  'ki', 'ka', 'ke', 'wale', 'wala', 'wali',
  'price', 'kya', 'hai', 'kitne', 'kitna',
]);

class QueryBuilder {
  private query: string;
  private params: any[];
  private paramIndex: number;

  constructor(baseQuery: string) {
    this.query = baseQuery;
    this.params = [];
    this.paramIndex = 1;
  }

  addCategoryFilter(category: string): this {
    this.query += ` AND LOWER(category) = LOWER($${this.paramIndex})`;
    this.params.push(category);
    this.paramIndex++;
    return this;
  }

  addBudgetFilter(budget: number): this {
    this.query += ` AND price <= $${this.paramIndex}`;
    this.params.push(budget);
    this.paramIndex++;
    return this;
  }

  addRatingFilter(rating: number): this {
    this.query += ` AND rating >= $${this.paramIndex}`;
    this.params.push(rating);
    this.paramIndex++;
    return this;
  }

  addPriceRangeFilter(min: number, max: number, hasBudget: boolean): this {
    if (hasBudget) return this;
    if (min > 0) {
      this.query += ` AND price >= $${this.paramIndex}`;
      this.params.push(min);
      this.paramIndex++;
    }
    if (max > 0) {
      this.query += ` AND price <= $${this.paramIndex}`;
      this.params.push(max);
      this.paramIndex++;
    }
    return this;
  }

  addKeywordFilter(keywords: string[], hasCategory: boolean): this {
    const meaningfulKeywords = keywords.filter(
      kw => !SQL_STOP_WORDS.has(kw.toLowerCase()) && kw.length > 1
    );
    if (meaningfulKeywords.length === 0) return this;

    const fields = hasCategory
      ? ['LOWER(name)', 'LOWER(title)']
      : ['LOWER(name)', 'LOWER(title)', 'LOWER(description)', 'LOWER(category)'];

    const keywordConditions = meaningfulKeywords.map((keyword) => {
      const fieldConditions = fields.map(field =>
        `${field} LIKE LOWER($${this.paramIndex})`
      ).join(' OR ');
      this.params.push(`%${keyword}%`);
      this.paramIndex++;
      return `(${fieldConditions})`;
    });

    this.query += ` AND (${keywordConditions.join(' OR ')})`;
    return this;
  }

  addSorting(isPriceQuery: boolean): this {
    if (isPriceQuery) {
      this.query += ` ORDER BY price ASC, rating DESC NULLS LAST`;
    } else {
      this.query += ` ORDER BY rating DESC NULLS LAST, price ASC`;
    }
    return this;
  }

  addLimit(limit: number): this {
    this.query += ` LIMIT ${limit}`;
    return this;
  }

  build(): { query: string; params: any[] } {
    return { query: this.query, params: this.params };
  }
}

class ProductNameCleaner {
  private readonly cleanPatterns: RegExp[] = [
    /wale|wala|wali/gi,
    /ki price|ka price|ke price/gi,
    /kya hai|price kya/gi,
    /kitne ka|kitne ki|kitna/gi,
    /mujhe|chahiye|batao|dikhao/gi,
  ];

  clean(productName: string): string {
    let cleaned = productName;
    for (const pattern of this.cleanPatterns) {
      cleaned = cleaned.replace(pattern, ' ');
    }
    return cleaned.replace(/\s+/g, ' ').trim();
  }

  tokenize(productName: string): string[] {
    const cleaned = this.clean(productName);
    return cleaned
      .toLowerCase()
      .replace(/[.,!?]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1 && !HINGLISH_NOISE.has(token));
  }
}

export class ProductTools {
  private readonly nameCleaner: ProductNameCleaner;

  constructor() {
    this.nameCleaner = new ProductNameCleaner();
  }

  async searchProducts(intent: QueryIntent): Promise<Product[]> {
    try {
      const client = await pgPool.connect();
      const builder = new QueryBuilder('SELECT * FROM products WHERE 1=1');

      if (intent.category) builder.addCategoryFilter(intent.category);
      if (intent.budget) builder.addBudgetFilter(intent.budget);
      if (intent.keywords && intent.keywords.length > 0)
        builder.addKeywordFilter(intent.keywords, !!intent.category);
      if (intent.rating) builder.addRatingFilter(intent.rating);
      if (intent.priceRange)
        builder.addPriceRangeFilter(intent.priceRange.min, intent.priceRange.max, !!intent.budget);

      builder.addSorting(intent.type === 'price_query');
      builder.addLimit(10);

      const { query, params } = builder.build();
      const result = await client.query(query, params);
      client.release();
      return result.rows;
    } catch {
      return [];
    }
  }

  async getTopRatedProducts(category?: string, limit: number = 10): Promise<Product[]> {
    try {
      const client = await pgPool.connect();
      let query = 'SELECT * FROM products WHERE rating IS NOT NULL';
      const params: any[] = [];

      if (category) {
        query += ' AND LOWER(category) = LOWER($1)';
        params.push(category);
      }

      query += ` ORDER BY rating DESC, price ASC LIMIT $${params.length + 1}`;
      params.push(limit);

      const result = await client.query(query, params);
      client.release();
      return result.rows;
    } catch {
      return [];
    }
  }

  async getProductByName(productName: string): Promise<Product | null> {
    if (!productName || productName.trim() === '') return null;

    try {
      const client = await pgPool.connect();
      const cleanedName = this.nameCleaner.clean(productName);

      // Step 1: Exact / near-exact match
      const exactResult = await this.tryExactMatch(client, cleanedName);
      if (exactResult) { client.release(); return exactResult; }

      // Step 2: Full phrase match (for multi-word names like "Red Dead Redemption 2")
      const phraseResult = await this.tryPhraseMatch(client, cleanedName);
      if (phraseResult) { client.release(); return phraseResult; }

      // Step 3: Token-based match
      const tokenResult = await this.tryTokenMatch(client, productName);
      client.release();
      return tokenResult;
    } catch {
      return null;
    }
  }

  private async tryExactMatch(client: any, cleanedName: string): Promise<Product | null> {
    const query = `
      SELECT * FROM products
      WHERE LOWER(name) LIKE LOWER($1)
         OR LOWER(title) LIKE LOWER($1)
      ORDER BY
        CASE
          WHEN LOWER(name) = LOWER($2) THEN 0
          WHEN LOWER(title) = LOWER($2) THEN 1
          ELSE 2
        END,
        rating DESC NULLS LAST
      LIMIT 1
    `;
    const result = await client.query(query, [`%${cleanedName}%`, cleanedName.toLowerCase()]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // ✅ NEW: Phrase match — searches full product name as a phrase
  private async tryPhraseMatch(client: any, cleanedName: string): Promise<Product | null> {
    // Split into words, build AND conditions so ALL words must appear
    const words = cleanedName.toLowerCase().split(/\s+/).filter(w => w.length > 1);
    if (words.length <= 1) return null; // Single word handled by exact match

    const conditions = words.map((_, i) =>
      `(LOWER(name) LIKE $${i + 1} OR LOWER(title) LIKE $${i + 1})`
    ).join(' AND ');

    const params = words.map(w => `%${w}%`);

    const query = `
      SELECT * FROM products
      WHERE ${conditions}
      ORDER BY rating DESC NULLS LAST
      LIMIT 1
    `;

    const result = await client.query(query, params);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  private async tryTokenMatch(client: any, productName: string): Promise<Product | null> {
    const tokens = this.nameCleaner.tokenize(productName);
    if (tokens.length === 0) return null;

    const conditions = tokens.map((_, i) =>
      `(CASE WHEN LOWER(name) LIKE $${i + 1} OR LOWER(title) LIKE $${i + 1} THEN 1 ELSE 0 END)`
    );

    const scoreExpr = conditions.join(' + ');
    const tokenParams = tokens.map(t => `%${t}%`);

    // ✅ FIX: Score threshold = ceil(tokens/2) so partial matches work
    // "Red Dead Redemption 2" → 4 tokens → need 2+ matches
    const minScore = Math.ceil(tokens.length / 2);

    const query = `
      SELECT *, (${scoreExpr}) AS match_score
      FROM products
      WHERE (${scoreExpr}) >= ${minScore}
      ORDER BY match_score DESC, rating DESC NULLS LAST
      LIMIT 1
    `;

    const result = await client.query(query, tokenParams);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async getSimilarProducts(productId: number, category: string, limit: number = 5): Promise<Product[]> {
    try {
      const client = await pgPool.connect();
      const query = `
        SELECT * FROM products
        WHERE LOWER(category) = LOWER($1) AND id != $2
        ORDER BY rating DESC NULLS LAST
        LIMIT $3
      `;
      const result = await client.query(query, [category, productId, limit]);
      client.release();
      return result.rows;
    } catch {
      return [];
    }
  }

  async getProductsByCategory(category: string, limit: number = 20): Promise<Product[]> {
    try {
      const client = await pgPool.connect();
      const query = `
        SELECT * FROM products
        WHERE LOWER(category) = LOWER($1)
        ORDER BY rating DESC NULLS LAST, price ASC
        LIMIT $2
      `;
      const result = await client.query(query, [category, limit]);
      client.release();
      return result.rows;
    } catch {
      return [];
    }
  }

  async getAllProducts(limit: number = 50): Promise<Product[]> {
    try {
      const client = await pgPool.connect();
      const query = `SELECT * FROM products ORDER BY id ASC LIMIT $1`;
      const result = await client.query(query, [limit]);
      client.release();
      return result.rows;
    } catch {
      return [];
    }
  }
}

const productToolsInstance = new ProductTools();

export const searchProducts       = (intent: QueryIntent)                        => productToolsInstance.searchProducts(intent);
export const getTopRatedProducts  = (category?: string, limit?: number)          => productToolsInstance.getTopRatedProducts(category, limit);
export const getProductByName     = (name: string)                               => productToolsInstance.getProductByName(name);
export const getSimilarProducts   = (id: number, category: string, limit?: number) => productToolsInstance.getSimilarProducts(id, category, limit);
export const getProductsByCategory = (category: string, limit?: number)          => productToolsInstance.getProductsByCategory(category, limit);
export const getAllProducts        = (limit?: number)                             => productToolsInstance.getAllProducts(limit);