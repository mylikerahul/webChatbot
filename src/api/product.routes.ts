import { FastifyInstance } from 'fastify';
import { log } from '../utils/logger.js';
import { pgPool } from '../services/supabase.js';

export async function productRoutes(fastify: FastifyInstance) {
  
  fastify.get('/api/products', async (request, reply) => {
    try {
      const client = await pgPool.connect();
      const result = await client.query(`
        SELECT id, name, title, description, category, price, rating, image, stock
        FROM products ORDER BY id ASC
      `);
      client.release();
      
      return { success: true, products: result.rows, total: result.rows.length };
    } catch (error) {
      log.error('Failed to fetch products:', error);
      return reply.code(500).send({ success: false, error: 'Failed to fetch products' });
    }
  });

  fastify.get('/test-db', async (request, reply) => {
    try {
      const client = await pgPool.connect();
      const result = await client.query(`SELECT NOW() as time`);
      client.release();
      return { success: true, data: result.rows[0] };
    } catch (error) {
      return reply.code(500).send({ success: false });
    }
  });
}