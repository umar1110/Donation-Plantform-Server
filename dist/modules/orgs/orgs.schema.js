"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrgsSchema = void 0;
const zod_1 = require("zod");
const createOrgsSchema = zod_1.z.object({
    // Orgs fields
    name: zod_1.z.string("Name is required").min(2, "Orgs name must be at least 2 characters long"),
    subdomain: zod_1.z.string("Subdomain is required").min(2, "Subdomain must be at least 2 characters long"),
    description: zod_1.z.string("Description is required"),
    website: zod_1.z.string().url("Invalid website URL").optional().nullable(),
    ABN: zod_1.z.string().optional().nullable(),
    type: zod_1.z.string().optional().nullable(),
    country: zod_1.z.string("Country is required").min(1, "Country is required"),
    state_province: zod_1.z.string("State/Province is required").min(1, "State/Province is required"),
    city: zod_1.z.string("City is required").min(1, "City is required"),
    address: zod_1.z.string("Address is required").min(5, "Address must be at least 5 characters long"),
    receipt_prefix: zod_1.z.string().optional(),
    // Owner user fields
    first_name: zod_1.z.string("First name is required").min(2, "First name must be at least 2 characters long"),
    last_name: zod_1.z.string("Last name is required").min(2, "Last name must be at least 2 characters long"),
    user_email: zod_1.z.string("Email is required").email("Invalid email address"),
    user_password: zod_1.z.string("Password is required").min(6, "Password must be at least 6 characters long"),
});
exports.createOrgsSchema = createOrgsSchema;
