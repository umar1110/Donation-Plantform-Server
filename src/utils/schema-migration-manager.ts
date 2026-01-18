import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { pool, executeInSchema } from "../config/database";
import logger from "./logger";

interface SchemaVersion {
  schema_name: string;
  version: number;
  migration_name: string;
  applied_at: Date;
}

export class SchemaMigrationManager {
  private schemaMigrationsPath = join(
    __dirname,
    "../../supabase/migrations/schema",
  );
  private publicMigrationsPath = join(
    __dirname,
    "../../supabase/migrations/public",
  );

  private client: any;

  constructor(client?: any) {
    this.client = client; // If provided, use this client (transactional)
  }

  private getQueryClient() {
    // Use provided client or fallback to pool.query
    if (this.client) return this.client;
    return pool;
  }

  async initializeMigrationTracking(): Promise<void> {
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
    logger.info("Schema migration tracking initialized");
  }

  getAvailableMigrations(): Array<{
    version: number;
    name: string;
    path: string;
  }> {
    const files = readdirSync(this.schemaMigrationsPath)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    return files.map((file) => {
      const match = file.match(/^(\d+)_(.+)\.sql$/);
      if (!match) throw new Error(`Invalid migration filename: ${file}`);
      return {
        version: parseInt(match[1]),
        name: match[2],
        path: join(this.schemaMigrationsPath, file),
      };
    });
  }

  async getAppliedMigrations(schemaName: string): Promise<number[]> {
    const result = await this.getQueryClient().query(
      `SELECT version FROM public.schema_migrations 
       WHERE schema_name = $1 
       ORDER BY version`,
      [schemaName],
    );
    return result.rows.map((r: { version: number }) => r.version);
  }

  async applyMigration(
    schemaName: string,
    migration: { version: number; name: string; path: string },
  ): Promise<void> {
    const sql = readFileSync(migration.path, "utf-8");

    // Always execute inside the same client/transaction
    const clientToUse = this.client
      ? async (schema: string, fn: any) => fn(this.client)
      : executeInSchema;

    await clientToUse(schemaName, async (client: any) => {
      // Set search_path to the tenant schema so unqualified objects are created in the correct schema
      await client.query(`SET search_path TO ${schemaName}, public`);
      
      await client.query(sql);
      await client.query(
        `INSERT INTO public.schema_migrations (schema_name, version, migration_name)
         VALUES ($1, $2, $3)
         ON CONFLICT (schema_name, version) DO NOTHING`,
        [schemaName, migration.version, migration.name],
      );
    });

    logger.info(
      `Applied migration ${migration.version}_${migration.name} to ${schemaName}`,
    );
  }

  async applyPendingMigrations(schemaName: string): Promise<number> {
    const available = this.getAvailableMigrations();
    const applied = await this.getAppliedMigrations(schemaName);

    const pending = available.filter((m) => !applied.includes(m.version));
    if (pending.length === 0) {
      logger.info(`No pending migrations for ${schemaName}`);
      return 0;
    }

    logger.info(`Applying ${pending.length} migrations to ${schemaName}`);
    for (const migration of pending) {
      await this.applyMigration(schemaName, migration);
    }

    return pending.length;
  }

  async applyToAllTenants(): Promise<{ schema: string; count: number }[]> {
    const result = await pool.query<{ schema_name: string }>(
      `SELECT schema_name FROM public.tenants WHERE deleted_at IS NULL`,
    );

    const results = [];
    for (const row of result.rows) {
      const count = await this.applyPendingMigrations(row.schema_name);
      results.push({ schema: row.schema_name, count });
    }

    return results;
  }

  async runPublicMigrations(): Promise<void> {
    const files = readdirSync(this.publicMigrationsPath)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    const client = await pool.connect();
    try {
      logger.info("Starting public schema migrations...");
      for (const file of files) {
        logger.info(`Running migration: ${file}`);
        const sql = readFileSync(
          join(this.publicMigrationsPath, file),
          "utf-8",
        );
        await client.query(sql);
        logger.info(`✅ Migration completed: ${file}`);
      }
      logger.info("All public schema migrations completed successfully");
    } catch (error) {
      logger.error("❌ Migration failed:", error);
      throw error;
    } finally {
      client.release();
    }
  }
  /**
   * Get migration status for all tenants
   */
  async getMigrationStatus(): Promise<
    Array<{
      schema: string;
      current_version: number;
      latest_version: number;
      pending: number;
    }>
  > {
    const available = this.getAvailableMigrations();
    const latestVersion = Math.max(...available.map((m) => m.version), 0);

    // Decide client to use
    const queryClient = this.getQueryClient();

    // Fetch tenant schemas
    const result = await pool.query<{ schema_name: string }>(
      `SELECT schema_name FROM public.tenants WHERE deleted_at IS NULL`,
    );

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
