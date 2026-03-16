import { ChromaClient, IEmbeddingFunction, Collection, Metadata, Metadatas } from 'chromadb';
import { pipeline } from '@xenova/transformers';
import { log } from '../utils/logger.js';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductMetadata {
  id: number | string;
  name: string;
  category: string;
  price: number;
  rating: number;
}

interface VectorProduct extends ProductMetadata {
  similarity: number;
  inVector?: boolean;
}

interface SearchFilters {
  category?: string;
  maxPrice?: number;
  minRating?: number;
}

// ─── Singleton State ──────────────────────────────────────────────────────────

let embeddingModel: any = null;
let chromaClient: ChromaClient | null = null;
let collection: Collection | null = null;

// ─── Embedding Model ──────────────────────────────────────────────────────────

async function initEmbeddingModel() {
  if (!embeddingModel) {
    log.ai('🔄 Loading local embedding model...');
    embeddingModel = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
    log.success('✅ Embedding model loaded!');
  }
  return embeddingModel;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const model = await initEmbeddingModel();
  const output = await model(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data as number[]);
}

// ─── Custom Embedding Function ────────────────────────────────────────────────

class LocalEmbeddingFunction implements IEmbeddingFunction {
  async generate(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((text) => generateEmbedding(text)));
  }
}

const embeddingFunction = new LocalEmbeddingFunction();

// ─── ChromaDB Init ────────────────────────────────────────────────────────────

const COLLECTION_NAME = 'ecommerce_products';

export async function initChromaDB(): Promise<Collection | null> {
  try {
    if (!chromaClient) {
      chromaClient = new ChromaClient();
      log.success('✅ ChromaDB client initialized (in-memory mode)');
    }

    if (collection) return collection;

    try {
      collection = await chromaClient.getCollection({
        name: COLLECTION_NAME,
        embeddingFunction,
      });
      log.info('📦 Using existing collection');
    } catch {
      collection = await chromaClient.createCollection({
        name: COLLECTION_NAME,
        embeddingFunction,
        metadata: { 'hnsw:space': 'cosine' },
      });
      log.success('✅ Created new collection');
    }

    return collection;
  } catch (error) {
    log.error('❌ ChromaDB initialization failed:', error);
    log.warn('⚠️  Continuing without vector search...');
    return null;
  }
}

export async function resetCollection(): Promise<void> {
  if (chromaClient) {
    try {
      await chromaClient.deleteCollection({ name: COLLECTION_NAME });
      log.info('🗑️  Collection deleted');
    } catch {}
  }
  collection = null;
}

// ─── Document Builder ─────────────────────────────────────────────────────────

function buildDocument(product: any): string {
  return [product.name, product.title, product.description, product.category]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

// ─── Helper: Convert to ChromaDB Metadata ────────────────────────────────────

function toChromaMetadata(product: any): Metadata {
  return {
    id: String(product.id),
    name: String(product.name ?? ''),
    category: String(product.category ?? ''),
    price: Number(product.price) || 0,
    rating: Number(product.rating) || 0,
  };
}

// ─── Helper: Parse ChromaDB Metadata ─────────────────────────────────────────

function parseMetadata(meta: Metadata | null): ProductMetadata | null {
  if (!meta) return null;
  
  return {
    id: meta.id as number | string,
    name: meta.name as string,
    category: meta.category as string,
    price: meta.price as number,
    rating: meta.rating as number,
  };
}

// ─── Indexing ─────────────────────────────────────────────────────────────────

export async function addProductsToVectorDB(products: any[]): Promise<boolean> {
  if (!products.length) {
    log.warn('⚠️  No products provided for indexing');
    return false;
  }

  try {
    const coll = await initChromaDB();
    if (!coll) {
      log.warn('⚠️  Skipping vector indexing — ChromaDB not available');
      return false;
    }

    log.ai(`🔄 Indexing ${products.length} products...`);

    const BATCH_SIZE = 50;

    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);

      const ids: string[] = [];
      const documents: string[] = [];
      const embeddings: number[][] = [];
      const metadatas: Metadata[] = []; // ✅ Fixed type

      await Promise.all(
        batch.map(async (product) => {
          const doc = buildDocument(product);
          const embedding = await generateEmbedding(doc);

          ids.push(`product_${product.id}`);
          documents.push(doc);
          embeddings.push(embedding);
          metadatas.push(toChromaMetadata(product)); // ✅ Convert to Metadata
        })
      );

      await coll.add({ ids, embeddings, documents, metadatas });
      log.info(`📦 Indexed ${Math.min(i + BATCH_SIZE, products.length)} / ${products.length}`);
    }

    log.success(`✅ Successfully indexed ${products.length} products!`);
    return true;
  } catch (error) {
    log.error('❌ Vector indexing failed:', error);
    return false;
  }
}

// ─── Vector Search ────────────────────────────────────────────────────────────

export async function vectorSearchProducts(
  query: string,
  filters?: SearchFilters,
  limit = 10
): Promise<VectorProduct[]> {
  try {
    const coll = await initChromaDB();
    if (!coll) {
      log.warn('⚠️  ChromaDB not available, returning empty');
      return [];
    }

    log.ai(`🔍 Vector search: "${query}"`);

    const queryEmbedding = await generateEmbedding(query.toLowerCase());

    const where: Record<string, any> = {};
    if (filters?.category) where.category = filters.category;

    const results = await coll.query({
      queryEmbeddings: [queryEmbedding],
      nResults: limit,
      ...(Object.keys(where).length > 0 && { where }),
    });

    const metadatas = results.metadatas?.[0] ?? [];
    const distances = results.distances?.[0] ?? [];

    // ✅ Fixed parsing
    const products: VectorProduct[] = metadatas
      .map((meta, idx) => {
        const parsed = parseMetadata(meta);
        if (!parsed) return null;
        
        return {
          ...parsed,
          similarity: 1 - (distances[idx] ?? 0),
        };
      })
      .filter((p): p is VectorProduct => p !== null)
      .filter((p) => {
        if (filters?.maxPrice !== undefined && p.price > filters.maxPrice) return false;
        if (filters?.minRating !== undefined && p.rating < filters.minRating) return false;
        return true;
      });

    log.success(`✅ Found ${products.length} similar products`);
    return products;
  } catch (error) {
    log.error('❌ Vector search failed:', error);
    return [];
  }
}

// ─── Hybrid Search ────────────────────────────────────────────────────────────

export async function hybridSearch(
  query: string,
  sqlResults: any[],
  limit = 10
): Promise<any[]> {
  try {
    const vectorResults = await vectorSearchProducts(query, undefined, limit * 2);

    if (!vectorResults.length) {
      log.warn('⚠️  No vector results — falling back to SQL only');
      return sqlResults.slice(0, limit);
    }

    const vectorMap = new Map<string | number, VectorProduct>(
      vectorResults.map((p) => [String(p.id), p])
    );

    const merged = sqlResults.map((sqlProduct) => {
      const vectorData = vectorMap.get(String(sqlProduct.id));
      return {
        ...sqlProduct,
        similarity: vectorData?.similarity ?? 0,
        inVector: !!vectorData,
      };
    });

    for (const vp of vectorResults) {
      if (!merged.some((m) => String(m.id) === String(vp.id))) {
        const sqlData = sqlResults.find((s) => String(s.id) === String(vp.id));
        if (sqlData) {
          merged.push({ ...sqlData, similarity: vp.similarity, inVector: true });
        }
      }
    }

    merged.sort((a, b) => {
      if (a.inVector !== b.inVector) return a.inVector ? -1 : 1;
      if (a.similarity !== b.similarity) return b.similarity - a.similarity;
      return (b.rating ?? 0) - (a.rating ?? 0);
    });

    return merged.slice(0, limit);
  } catch (error) {
    log.error('❌ Hybrid search failed:', error);
    return sqlResults.slice(0, limit);
  }
}

export { initEmbeddingModel };