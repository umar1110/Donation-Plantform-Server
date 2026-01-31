"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaMigrationManager = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const database_1 = require("../config/database");
const logger_1 = __importDefault(require("./logger"));
class SchemaMigrationManager {
    constructor(client) {
        this.schemaMigrationsPath = (0, path_1.join)(__dirname, "../../supabase/migrations/schema");
        this.publicMigrationsPath = (0, path_1.join)(__dirname, "../../supabase/migrations/public");
        this.client = client; // If provided, use this client (transactional)
    }
    getQueryClient() {
        // Use provided client or fallback to pool.query
        if (this.client)
            return this.client;
        return database_1.pool;
    }
    async initializeMigrationTracking() {
        const query = `
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          schema_name VARCHAR(100) NOT NULL,
          version INTEGER NOT NULL,
          migration_name VARCHAR(255) NOT NULL,
          applied_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(schema_name, version)
      );
      CREATE INDEX IF NOT EXISTS idx_schema_migrations_schema 
          ON public.schema_migrations(schema_name);
    `;
        await this.getQueryClient().query(query);
        logger_1.default.info("Schema migration tracking initialized");
    }
    getAvailableMigrations() {
        const files = (0, fs_1.readdirSync)(this.schemaMigrationsPath)
            .filter((f) => f.endsWith(".sql"))
            .sort();
        return files.map((file) => {
            const match = file.match(/^(\d+)_(.+)\.sql$/);
            if (!match)
                throw new Error(`Invalid migration filename: ${file}`);
            return {
                version: parseInt(match[1]),
                name: match[2],
                path: (0, path_1.join)(this.schemaMigrationsPath, file),
            };
        });
    }
    async getAppliedMigrations(schemaName) {
        const result = await this.getQueryClient().query(`SELECT version FROM public.schema_migrations 
       WHERE schema_name = $1 
       ORDER BY version`, [schemaName]);
        return result.rows.map((r) => r.version);
    }
    async applyMigration(schemaName, migration) {
        const sql = (0, fs_1.readFileSync)(migration.path, "utf-8");
        // Always execute inside the same client/transaction
        const clientToUse = this.client
            ? async (schema, fn) => fn(this.client)
            : database_1.executeInSchema;
        await clientToUse(schemaName, async (client) => {
            // Set search_path to the orgs schema so unqualified objects are created in the correct schema
            await client.query(`SET search_path TO ${schemaName}, public`);
            await client.query(sql);
            await client.query(`INSERT INTO public.schema_migrations (schema_name, version, migration_name)
         VALUES ($1, $2, $3)
         ON CONFLICT (schema_name, version) DO NOTHING`, [schemaName, migration.version, migration.name]);
        });
        logger_1.default.info(`Applied migration ${migration.version}_${migration.name} to ${schemaName}`);
    }
    async applyPendingMigrations(schemaName) {
        const available = this.getAvailableMigrations();
        const applied = await this.getAppliedMigrations(schemaName);
        const pending = available.filter((m) => !applied.includes(m.version));
        if (pending.length === 0) {
            logger_1.default.info(`No pending migrations for ${schemaName}`);
            return 0;
        }
        logger_1.default.info(`Applying ${pending.length} migrations to ${schemaName}`);
        for (const migration of pending) {
            await this.applyMigration(schemaName, migration);
        }
        return pending.length;
    }
    async applyToAllOrgs() {
        const result = await database_1.pool.query(`SELECT schema_name FROM public.orgs WHERE deleted_at IS NULL`);
        const results = [];
        for (const row of result.rows) {
            const count = await this.applyPendingMigrations(row.schema_name);
            results.push({ schema: row.schema_name, count });
        }
        return results;
    }
    async runPublicMigrations() {
        const files = (0, fs_1.readdirSync)(this.publicMigrationsPath)
            .filter((f) => f.endsWith(".sql"))
            .sort();
        const client = await database_1.pool.connect();
        try {
            logger_1.default.info("Starting public schema migrations...");
            for (const file of files) {
                logger_1.default.info(`Running migration: ${file}`);
                const sql = (0, fs_1.readFileSync)((0, path_1.join)(this.publicMigrationsPath, file), "utf-8");
                await client.query(sql);
                logger_1.default.info(`✅ Migration completed: ${file}`);
            }
            logger_1.default.info("All public schema migrations completed successfully");
        }
        catch (error) {
            logger_1.default.error("❌ Migration failed:", error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * Get migration status for all orgs
     */
    async getMigrationStatus() {
        const available = this.getAvailableMigrations();
        const latestVersion = Math.max(...available.map((m) => m.version), 0);
        // Decide client to use
        const queryClient = this.getQueryClient();
        // Fetch orgs schemas
        const result = await database_1.pool.query(`SELECT schema_name FROM public.orgs WHERE deleted_at IS NULL`);
        const status = [];
        for (const row of result.rows) {
            const applied = await this.getAppliedMigrations(row.schema_name);
            const currentVersion = applied.length ? Math.max(...applied) : 0;
            status.push({
                schema: row.schema_name,
                current_version: currentVersion,
                latest_version: latestVersion,
                pending: latestVersion - currentVersion,
            });
        }
        return status;
    }
}
exports.SchemaMigrationManager = SchemaMigrationManager;
