import {z} from "zod";

const createOrgsSchema = z.object({
    // Orgs fields
    name: z.string("Name is required").min(2, "Orgs name must be at least 2 characters long"),
    subdomain: z.string("Subdomain is required").min(2, "Subdomain must be at least 2 characters long"),
    description: z.string("Description is required").min(10, "Description must be at least 10 characters long"),
    website: z.string().url("Invalid website URL").optional().nullable(),
    ABN: z.string().optional().nullable(),
    type: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
    
    // Owner user fields
    first_name: z.string("First name is required").min(2, "First name must be at least 2 characters long"),
    last_name: z.string("Last name is required").min(2, "Last name must be at least 2 characters long"),
    user_email: z.string("Email is required").email("Invalid email address"),
    user_password: z.string("Password is required").min(6, "Password must be at least 6 characters long"),
});

export {createOrgsSchema};
