import { z } from "zod";
import { pool } from "../../config/database";
import { supabaseAdmin } from "../../config/supabase";
import { ApiError } from "../../utils/apiError";
import { SchemaMigrationManager } from "../../utils/schema-migration-manager";
import { createOrgsSchema } from "./orgs.schema";

export async function createOrgs(
  orgsData: z.infer<typeof createOrgsSchema>,
) {
  const { name, subdomain, first_name, last_name, user_email, user_password } =
    orgsData;

  const schemaName = `orgs_${subdomain}`;
  const client = await pool.connect();

  let orgsId: string;

  try {
    await client.query("BEGIN");

    // 1. Create orgs record (temporary state)
    const orgsRes = await client.query(
      `INSERT INTO public.orgs (name, subdomain, schema_name)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [name, subdomain, schemaName],
    );

    orgsId = orgsRes.rows[0].id;

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

    // 6. Activate orgs
    await client.query(
      `UPDATE public.orgs
     SET owner_id = $1,
         owner_email = $2,
         status = 'active'
     WHERE id = $3`,
      [data.user.id, user_email, orgsId],
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
    orgsId,
    schemaName,
  };
}
