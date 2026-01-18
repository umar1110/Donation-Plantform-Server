import {z} from "zod";
import { pool } from "../../config/database";
import { createTenantSchema } from "./tenant.schema";

export class TenantService {

    async getTenantInfo(tenantId: string) {
        // Logic to get tenant info from database
        const tenant = await pool.query(
            'SELECT * FROM public.tenants WHERE id = $1',
            [tenantId]
        );

        return tenant.rows[0];
    }

    async createTenant(tenantData:z.infer<typeof createTenantSchema>, dbClient: any) {
        const { name, subdomain, user_name, user_email, user_password } = tenantData;
        
    }
}