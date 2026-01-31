import { PoolClient } from "pg";
import { pool } from "../../config/database";
import { IUserProfile } from "../users/user_types";

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
      description: string;
      website?: string | null;
      ABN?: string | null;
      type?: string | null;
      country: string;
      state_province: string;
      city: string;
      address: string;
      receipt_prefix: string;
    },
  ): Promise<string> {
    const result = await client.query(
      `INSERT INTO public.orgs (name, subdomain, description, website, abn, type, country, state_province, city, address, receipt_prefix)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        data.name,
        data.subdomain,
        data.description,
        data.website,
        data.ABN,
        data.type,
        data.country,
        data.state_province,
        data.city,
        data.address,
        data.receipt_prefix,
      ],
    );
    return result.rows[0].id;
  }

  // Insert user profile into organization schema
  async insertUserProfile(
    client: PoolClient,
    organizationId: string,
    authUserId: string,
    firstName: string,
    lastName: string,
    email: string,
  ): Promise<IUserProfile> {
    const result = await client.query(
      `INSERT INTO user_profiles
       (auth_user_id, first_name, last_name, email ,org_id, is_organization_admin)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [authUserId, firstName, lastName, email, organizationId],
    );

    console.log("Inserted user profile result:", result);
    return result.rows[0];
  }

  // Update organization with owner info and activate
  async updateOrgsStatus(
    client: PoolClient,
    orgsId: string,
    ownerId: string,
    ownerEmail: string,
  ): Promise<void> {
    await client.query(
      `UPDATE public.orgs
       SET owner_id = $1,
           owner_email = $2,
           status = 'active'
       WHERE id = $3`,
      [ownerId, ownerEmail, orgsId],
    );
  }

  // Select organization by ID
  async selectOrgsById(orgsId: string) {
    const result = await pool.query("SELECT * FROM public.orgs WHERE id = $1", [
      orgsId,
    ]);
    return result.rows[0];
  }
}
