import { pgPool } from '../db/supabaseClient.js';
import { addProductsToVectorDB, initChromaDB } from '../vector/chromaClient.js';
import { log } from '../utils/logger.js';

export async function ingestProductsToVectorDB() {
  try {
    log.info('🚀 Starting data ingestion pipeline...');

    // Initialize ChromaDB
    await initChromaDB();

    // Fetch all products from database
    log.db('📊 Fetching products from database...');
    const client = await pgPool.connect();
    const result = await client.query('SELECT * FROM products ORDER BY id');
    client.release();

    const products = result.rows;
    log.info(`📦 Found ${products.length} products to index`);

    // Add to vector database
    const success = await addProductsToVectorDB(products);

    if (success) {
      log.success('✅ Data ingestion complete!');
      log.info(`✨ Indexed ${products.length} products in ChromaDB`);
    } else {
      log.warn('⚠️  Ingestion completed with warnings');
    }

    return success;

  } catch (error) {
    log.error('❌ Data ingestion failed:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestProductsToVectorDB()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}