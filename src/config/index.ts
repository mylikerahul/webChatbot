import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env') });

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000'),
    host: '0.0.0.0',
  },
  database: {
    user: process.env.DB_USER!,
    host: process.env.DB_HOST!,
    database: process.env.DB_NAME!,
    password: process.env.DB_PASS!,
    port: parseInt(process.env.DB_PORT || '6543'),
  },
  supabase: {
    url: process.env.SUPABASE_URL!,
    anonKey: process.env.SUPABASE_KEY!,
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
};