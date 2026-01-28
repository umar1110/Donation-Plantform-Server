import { PoolClient } from "pg";
import { IUser } from "./modules/users/user_types";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      schemaName?: string;
      orgsId?: string;
      db?: PoolClient;
      orgs?: {
        id: string;
        name: string;
        subdomain: string;
        schema_name: string;
        [key: string]: any;
      };
    }
  }
}

export {};
