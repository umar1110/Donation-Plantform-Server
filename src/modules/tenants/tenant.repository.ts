import { PoolClient } from "pg";
import { createTenantSchema } from "./tenant.schema";
import { z } from "zod";
import { SchemaMigrationManager } from "../../utils/schema-migration-manager";
import { supabase, supabaseAdmin } from "../../config/supabase";
import { ApiError } from "../../utils/apiError";

export async function createTenant(
  dbClient: PoolClient,
  tenantData: z.infer<typeof createTenantSchema>,
) {
  const { name, subdomain, user_name, user_email, user_password } = tenantData;

  // Steps:
  // 1- Create Schema for tenant
  // 2- Run migrations on that schema
  // 3- Create user in that schema.user table
  // 4- Insert tenant record in public.tenants table

  // 1- Create Schema
  const schemaName = `tenant_${subdomain}`;
  await dbClient.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);

  // 2- Run migrations on that schema
  const migrationManager = new SchemaMigrationManager();

  await migrationManager.initializeMigrationTracking();
  await migrationManager.applyPendingMigrations(schemaName);

  // 3- create supabase auth user

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: user_email,
    password: user_password,
    email_confirm: true,
  });

  if (error) {
    throw new ApiError(500, "Failed to create user in auth system", [
      error.message,
    ]);
  }

  //   TODO: 3b- Insert user into tenant's user_profile table

  // 4- Insert tenant into tenants table
  const tenantInsertResult = await dbClient.query(
    `INSERT INTO public.tenants (name, subdomain, schema_name, owner_id, owner_email)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [name, subdomain, schemaName, data.user?.id, user_email],
  );

  const tenantId = tenantInsertResult.rows[0].id;

  // Create schema for the tenant

  // Create user in supabase (auth) - Placeholder logic
  return {
    tenantId,
    schemaName,
  };
}
