import { PoolClient } from "pg";
import { IUser } from "./modules/users/user_types";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      org?: {
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
