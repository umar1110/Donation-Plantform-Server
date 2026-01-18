import {z} from "zod";

const createTenantSchema = z.object({
    name: z.string("Name is required").min(2, "Tenant name must be at least 2 characters long"),
    subdomain: z.string("Subdomain is required").min(2, "Subdomain must be at least 2 characters long"),
    user_name: z.string("Username is required").min(3, "Username must be at least 3 characters long"),
    user_email: z.string("Email is required").email("Invalid email address"),
    user_password: z.string("Password is required").min(6, "Password must be at least 6 characters long"),
});

export {createTenantSchema};
