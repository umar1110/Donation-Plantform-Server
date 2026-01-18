import { pool } from "../config/database";

export class TenantService {

    async getTenantInfo(tenantId: string) {
        // Logic to get tenant info from database
        const tenant = await pool.query(
            'SELECT * FROM public.tenants WHERE id = $1',
            [tenantId]
        );

        return tenant.rows[0];
    }
}