import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { config } from './env';
import  logger from '../utils/logger';

// Create PostgreSQL connection pool
export const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user || "",
  password: config.db.password || "",
  database: config.db.name,
  max: config.db.maxConnections,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Pool event handlers
pool.on('connect', () => {
  logger.info('New database connection established');
});

pool.on('error', (err:any) => {
  logger.error('Unexpected database error:', err);
  process.exit(-1);
});

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connection successful:', result.rows[0]);
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
}

// Execute query in specific schema
export async function executeInSchema<T = any>(
  schemaName: string,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Set search_path to tenant schema + public
    await client.query(`SET search_path TO ${schemaName}, public`);
    
    // Execute callback
    const result = await callback(client);
    
    // Commit transaction
    await client.query('COMMIT');
    
    return result;
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    throw error;
  } finally {
    // Reset search_path and release client
    await client.query('SET search_path TO public');
    client.release();
  }
}

// Execute query with automatic retry
export async function executeWithRetry<T>(
  queryFn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error) {
      lastError = error as Error;
      logger.warn(`Query attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  
  throw lastError;
}

// Get client from pool for manual transaction handling
export async function getClient(): Promise<PoolClient> {
  return await pool.connect();
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await pool.end();
    logger.info('Database pool closed successfully');
  } catch (error) {
    logger.error('Error closing database pool:', error);
    throw error;
  }
}

// Query helper with logging
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    
    logger.debug('Executed query', {
      text,
      duration: `${duration}ms`,
      rows: result.rowCount
    });
    
    return result;
  } catch (error) {
    logger.error('Query error:', { text, error });
    throw error;
  }
}