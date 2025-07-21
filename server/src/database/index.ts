import knex, { Knex } from 'knex';
import { logger } from '../utils/logger';

let db: Knex;

export async function initializeDatabase(): Promise<Knex> {
  if (db) return db;
  
  const config: Knex.Config = {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'mmorpg_game'
    },
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000
    },
    migrations: {
      directory: './src/database/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './src/database/seeds'
    }
  };
  
  db = knex(config);
  
  // Test connection
  try {
    await db.raw('SELECT 1');
    logger.info('Database connection established');
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
  
  return db;
}

export function getDatabase(): Knex {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export default getDatabase;