import {z} from "zod";
import { pool } from "../../config/database";
import { createOrgsSchema } from "./orgs.schema";

export class OrgsService {

    async getOrgsInfo(orgsId: string) {
        // Logic to get orgs info from database
        const orgs = await pool.query(
            'SELECT * FROM public.orgss WHERE id = $1',
            [orgsId]
        );

        return orgs.rows[0];
    }

    async createOrgs(orgsData:z.infer<typeof createOrgsSchema>, dbClient: any) {
        const { name, subdomain, user_email, user_password } = orgsData;
        
    }
}