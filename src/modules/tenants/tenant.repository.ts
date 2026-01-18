import { PoolClient } from "pg";
import { createTenantSchema } from "./tenant.schema";
import { z } from "zod";
import { SchemaMigrationManager } from "../../utils/schema-migration-manager";
import { supabase, supabaseAdmin } from "../../config/supabase";
import { ApiError } from "../../utils/apiError";
import { pool } from "../../config/database";

export async function createTenant(
  tenantData: z.infer<typeof createTenantSchema>,
) {
  const { name, subdomain, first_name, last_name, user_email, user_password } =
    tenantData;

  const schemaName = `tenant_${subdomain}`;
  const client = await pool.connect();

  let tenantId: string;

  try {
    await client.query("BEGIN");

    // 1. Create tenant record (temporary state)
    const tenantRes = await client.query(
      `INSERT INTO public.tenants (name, subdomain, schema_name)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [name, subdomain, schemaName],
    );

    tenantId = tenantRes.rows[0].id;

    // 2. Create schema
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);

    // 3. Run migrations USING SAME CLIENT
    const migrationManager = new SchemaMigrationManager(client);
    await migrationManager.applyPendingMigrations(schemaName);

    // 4. Create auth user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: user_email,
      password: user_password,
      email_confirm: true,
    });

    if (error || !data.user) {
      // Throw error to trigger rollback
      console.error("Error creating auth user:", error);
      throw new ApiError(500, "Failed to create auth user", [error?.message]);
    }

    // 5. Insert user profile
    await client.query(
      `INSERT INTO ${schemaName}.user_profiles
     (auth_user_id, first_name, last_name, email, is_admin)
     VALUES ($1, $2, $3, $4, true)`,
      [data.user.id, first_name, last_name, user_email],
    );

    // 6. Activate tenant
    await client.query(
      `UPDATE public.tenants
     SET owner_id = $1,
         owner_email = $2,
         status = 'active'
     WHERE id = $3`,
      [data.user.id, user_email, tenantId],
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  // ---- OUTSIDE TRANSACTION ----

  return {
    tenantId,
    schemaName,
  };
}
