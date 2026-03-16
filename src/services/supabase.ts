import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
const { Pool } = pkg;
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

// PostgreSQL Direct Connection
export const pgPool = new Pool({
  user: config.database.user,
  host: config.database.host,
  database: config.database.database,
  password: config.database.password,
  port: config.database.port,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test database connection
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const client = await pgPool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    logger.info('✅ Database connected successfully!');
    logger.info(`📅 Current DB Time: ${result.rows[0].now}`);
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    return false;
  }
};

// Supabase Client (for REST API)
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);