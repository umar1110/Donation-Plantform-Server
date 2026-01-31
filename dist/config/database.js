"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.testDatabaseConnection = testDatabaseConnection;
exports.executeInSchema = executeInSchema;
exports.executeWithRetry = executeWithRetry;
exports.getClient = getClient;
exports.closeDatabaseConnection = closeDatabaseConnection;
exports.query = query;
const pg_1 = require("pg");
const env_1 = require("./env");
const logger_1 = __importDefault(require("../utils/logger"));
// Create PostgreSQL connection pool
exports.pool = new pg_1.Pool({
    host: env_1.config.db.host,
    port: env_1.config.db.port,
    user: env_1.config.db.user || "",
    password: env_1.config.db.password || "",
    database: env_1.config.db.name,
    max: env_1.config.db.maxConnections,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});
// Pool event handlers
exports.pool.on('connect', () => {
    logger_1.default.info('New database connection established');
});
exports.pool.on('error', (err) => {
    logger_1.default.error('Unexpected database error:', err);
    process.exit(-1);
});
// Test database connection
async function testDatabaseConnection() {
    try {
        const client = await exports.pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        logger_1.default.info(`Database connection successful: ${result.rows[0].now}`);
        return true;
    }
    catch (error) {
        logger_1.default.error('Database connection failed:', error);
        return false;
    }
}
// Execute query in specific schema
async function executeInSchema(schemaName, callback) {
    const client = await exports.pool.connect();
    try {
        // Start transaction
        await client.query('BEGIN');
        // Set search_path to orgs schema + public
        await client.query(`SET search_path TO ${schemaName}, public`);
        // Execute callback
        const result = await callback(client);
        // Commit transaction
        await client.query('COMMIT');
        return result;
    }
    catch (error) {
        // Rollback on error
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        // Reset search_path and release client
        await client.query('SET search_path TO public');
        client.release();
    }
}
// Execute query with automatic retry
async function executeWithRetry(queryFn, maxRetries = 3, delayMs = 1000) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await queryFn();
        }
        catch (error) {
            lastError = error;
            logger_1.default.warn(`Query attempt ${attempt} failed:`, error);
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
            }
        }
    }
    throw lastError;
}
// Get client from pool for manual transaction handling
async function getClient() {
    return await exports.pool.connect();
}
// Graceful shutdown
async function closeDatabaseConnection() {
    try {
        await exports.pool.end();
        logger_1.default.info('Database pool closed successfully');
    }
    catch (error) {
        logger_1.default.error('Error closing database pool:', error);
        throw error;
    }
}
// Query helper with logging
async function query(text, params) {
    const start = Date.now();
    try {
        const result = await exports.pool.query(text, params);
        const duration = Date.now() - start;
        logger_1.default.debug('Executed query', {
            text,
            duration: `${duration}ms`,
            rows: result.rowCount
        });
        return result;
    }
    catch (error) {
        logger_1.default.error('Query error:', { text, error });
        throw error;
    }
}
