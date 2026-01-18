import {z} from "zod";

const createTenantSchema = z.object({
    name: z.string("Name is required").min(2, "Tenant name must be at least 2 characters long"),
    subdomain: z.string("Subdomain is required").min(2, "Subdomain must be at least 2 characters long"),
    first_name: z.string("First name is required").min(2, "First name must be at least 2 characters long"),
    last_name: z.string("Last name is required").min(2, "Last name must be at least 2 characters long"),
    user_email: z.string("Email is required").email("Invalid email address"),
    user_password: z.string("Password is required").min(6, "Password must be at least 6 characters long"),
});

export {createTenantSchema};
