import pg from 'pg';

const { Pool } = pg;

const connectionConfig = {
  connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

export const pgPool = new Pool(connectionConfig);

pgPool.on('error', (err) => {
  process.stderr.write(`Unexpected database pool error: ${err.message}\n`);
});

export async function testConnection(): Promise<boolean> {
  try {
    const client = await pgPool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch {
    return false;
  }
}

export async function closePool(): Promise<void> {
  await pgPool.end();
}

export default pgPool;