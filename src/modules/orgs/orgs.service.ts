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

  async getOrgInfo(orgsId: string) {
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

    // Derive receipt_prefix from state_province if not provided
    const final_receipt_prefix =
      receipt_prefix || (state_province ? state_province.toUpperCase() : "ORG");
    const client = await this.orgsRepository.getClient();

    let orgsId: string;
    let authUserId: string | null = null;
    try {
      await client.query("BEGIN");

      // 1. Create orgs record (temporary state)
      orgsId = await this.orgsRepository.insertOrgs(client, {
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
        receipt_prefix: final_receipt_prefix,
      });

      // 2. Create auth user
      // TODO: email_confirm should be false and send confirmation email
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: user_email,
        password: user_password,
        email_confirm: true,
        user_metadata: {
          orgsId: orgsId,
        },
      });
      authUserId = data?.user?.id || "";
      if (error || !data.user) {
        console.error("Error creating auth user:", error);
        throw new ApiError(
          500,
          error?.message || "Failed to create auth user",
          [error?.message],
        );
      }

      // 3. Insert user profile
      const userProfile = await this.orgsRepository.insertUserProfile(
        client,
        orgsId,
        data.user.id,
        first_name,
        last_name,
        user_email,
      );


      // 4. Activate orgs
      await this.orgsRepository.updateOrgsStatus(
        client,
        orgsId,
        userProfile.id,
        user_email,
      );

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      // Delete auth user if created
      if (authUserId) {
        await supabaseAdmin.auth.admin.deleteUser(authUserId);
      }
      throw err;
    } finally {
      client.release();
    }

    return {
      orgsId,
    };
  }
}
