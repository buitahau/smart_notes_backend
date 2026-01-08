import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { getEnv } from '../types/env';

const sql = neon(getEnv('DATABASE_URL'));
export const db = drizzle(sql);
