import { z } from "zod";
import { supabaseAdmin } from "../../config/supabase";
import { ApiError } from "../../utils/apiError";
import { SchemaMigrationManager } from "../../utils/schema-migration-manager";
import { OrgsRepository } from "./orgs.repository";
import { createOrgsSchema } from "./orgs.schema";

export class OrgsService {
  private orgsRepository: OrgsRepository;

  constructor() {
    this.orgsRepository = new OrgsRepository();
  }

  async getOrgsInfo(orgsId: string) {
    return this.orgsRepository.selectOrgsById(orgsId);
  }

  async createOrgs(orgsData: z.infer<typeof createOrgsSchema>) {
    const {
      name,
      subdomain,
      description,
      website,
      ABN,
      type,
      country,
      state_province,
      city,
      address,
      receipt_prefix,
      first_name,
      last_name,
      user_email,
      user_password,
    } = orgsData;

    const schemaName = `org_${subdomain}`;
    // Derive receipt_prefix from state_province if not provided
    const final_receipt_prefix = receipt_prefix || (state_province ? state_province.toUpperCase() : 'ORG');
    const client = await this.orgsRepository.getClient();

    let orgsId: string;

    try {
      await client.query("BEGIN");

      // 1. Create orgs record (temporary state)
      orgsId = await this.orgsRepository.insertOrgs(client, {
        name,
        subdomain,
        schemaName,
        description,
        website,
        ABN,
        type,
        country,
        state_province,
        city,
        address,
        receipt_prefix: final_receipt_prefix,
      });

      // 2. Create schema
      await this.orgsRepository.insertSchema(client, schemaName);

      // 3. Run migrations using same client
      const migrationManager = new SchemaMigrationManager(client);
      await migrationManager.applyPendingMigrations(schemaName);

      // 4. Create auth user
      // TODO: email_confirm should be false and send confirmation email
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: user_email,
        password: user_password,
        email_confirm: true,
        user_metadata: {
          orgsId: orgsId,
          schemaName: schemaName,
        },
      });

      if (error || !data.user) {
        console.error("Error creating auth user:", error);
        throw new ApiError(500, "Failed to create auth user", [error?.message]);
      }

      // 5. Insert user profile
      await this.orgsRepository.insertUserProfile(
        client,
        schemaName,
        data.user.id,
        first_name,
        last_name,
        user_email,
      );

      // 6. Activate orgs
      await this.orgsRepository.updateOrgsStatus(
        client,
        orgsId,
        data.user.id,
        user_email,
      );

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    return {
      orgsId,
      schemaName,
    };
  }
}
