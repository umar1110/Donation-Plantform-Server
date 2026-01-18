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