import { PoolClient } from "pg";
import { pool } from "../../config/database";

export class OrgsRepository {
  // Get a database client for transaction management
  async getClient(): Promise<PoolClient> {
    return pool.connect();
  }

  // Create orgs record in public schema
  async insertOrgs(
    client: PoolClient,
    data: {
      name: string;
      subdomain: string;
      schemaName: string;
      description: string;
      website?: string | null;
      ABN?: string | null;
      type?: string | null;
      country?: string | null;
    }
  ): Promise<string> {
    const result = await client.query(
      `INSERT INTO public.orgs (name, subdomain, schema_name, description, website, abn, type, country)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [data.name, data.subdomain, data.schemaName, data.description, data.website, data.ABN, data.type, data.country]
    );
    return result.rows[0].id;
  }

  // Create schema for the organization
  async insertSchema(client: PoolClient, schemaName: string): Promise<void> {
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
  }

  // Insert user profile into organization schema
  async insertUserProfile(
    client: PoolClient,
    schemaName: string,
    authUserId: string,
    firstName: string,
    lastName: string,
    email: string
  ): Promise<void> {
    await client.query(
      `INSERT INTO ${schemaName}.user_profiles
       (auth_user_id, first_name, last_name, email, is_organization_admin)
       VALUES ($1, $2, $3, $4, true)`,
      [authUserId, firstName, lastName, email]
    );
  }

  // Update organization with owner info and activate
  async updateOrgsStatus(
    client: PoolClient,
    orgsId: string,
    ownerId: string,
    ownerEmail: string
  ): Promise<void> {
    await client.query(
      `UPDATE public.orgs
       SET owner_id = $1,
           owner_email = $2,
           status = 'active'
       WHERE id = $3`,
      [ownerId, ownerEmail, orgsId]
    );
  }

  // Select organization by ID
  async selectOrgsById(orgsId: string) {
    const result = await pool.query(
      "SELECT * FROM public.orgs WHERE id = $1",
      [orgsId]
    );
    return result.rows[0];
  }
}
