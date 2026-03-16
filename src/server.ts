import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';

import { config } from './config/index.js';
import { log } from './utils/logger.js';
import { testDatabaseConnection, pgPool } from './services/supabase.js'; 

// Import modular routes
import { chatRoutes } from './api/chat.routes.js';
import { productRoutes } from './api/product.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({ 
  logger: false,
  requestTimeout: 60000,
});

// ─── REGISTER PLUGINS ───────────────────────────────────────────────────

await fastify.register(cors, { 
  origin: true,
  credentials: true,
});

await fastify.register(fastifyStatic, { 
  root: path.join(__dirname, '../public'), 
  prefix: '/public/' 
});

await fastify.register(fastifyView, { 
  engine: { ejs }, 
  root: path.join(__dirname, '../views') 
});

// ─── REGISTER API ROUTES (All routes are in these files) ───────────────

await fastify.register(chatRoutes);
await fastify.register(productRoutes);

// ─── FRONTEND ROUTES ────────────────────────────────────────────────────

fastify.get('/', async (request, reply) => {
  return reply.view('index.ejs', { 
    title: 'ShopAI - Advanced Shopping Assistant' 
  });
});

fastify.get('/cart', async (request, reply) => {
  return reply.view('cart.ejs', { 
    title: 'Shopping Cart - ShopAI' 
  });
});

// ─── HEALTH CHECK (Keep only if not in product.routes.ts) ──────────────

fastify.get('/health', async (request, reply) => {
  try {
    const client = await pgPool.connect();
    await client.query('SELECT 1');
    client.release();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime(),
    };
  } catch (error) {
    return reply.code(503).send({
      status: 'unhealthy',
      database: 'disconnected',
      error: (error as Error).message,
    });
  }
});

// ─── ERROR HANDLERS ─────────────────────────────────────────────────────

fastify.setErrorHandler((error, request, reply) => {
  log.error('Server Error:', error.message);
  reply.code(error.statusCode || 500).send({
    success: false,
    error: error.message || 'Internal Server Error',
  });
});

fastify.setNotFoundHandler((request, reply) => {
  reply.code(404).send({
    success: false,
    error: 'Route not found',
    path: request.url,
  });
});

// ─── START SERVER ───────────────────────────────────────────────────────

const start = async () => {
  try {
    log.info('🔌 Testing database connection...');
    const isConnected = await testDatabaseConnection();
    
    if (!isConnected) {
      log.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }
    
    log.success('✅ Database connected successfully');

    await fastify.listen({ 
      port: config.server.port, 
      host: config.server.host 
    });

    console.log('\n' + '═'.repeat(55));
    console.log('🚀 Server: http://localhost:' + config.server.port);
    console.log('💬 Chat:   http://localhost:' + config.server.port + '/api/chat');
    console.log('📦 Products: http://localhost:' + config.server.port + '/api/products');
    console.log('❤️  Health: http://localhost:' + config.server.port + '/health');
    console.log('═'.repeat(55));
    console.log('🧠 AI Ready: Intent Agent + Nina LLM + Workflow');
    console.log('═'.repeat(55) + '\n');

  } catch (err) {
    log.error('❌ Server failed to start:', err);
    process.exit(1);
  }
};

// ─── GRACEFUL SHUTDOWN ──────────────────────────────────────────────────

process.on('SIGINT', async () => {
  log.warn('\n🛑 Shutting down...');
  await pgPool.end();
  await fastify.close();
  console.log('👋 Server stopped.\n');
  process.exit(0);
});

start();