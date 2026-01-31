"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDonorSchema = void 0;
const zod_1 = require("zod");
exports.createDonorSchema = zod_1.z.object({
    org_id: zod_1.z.uuid("Organization ID is required."),
    first_name: zod_1.z.string("First Name is required."),
    last_name: zod_1.z.string("Last Name is required."),
    email: zod_1.z.string("Email is required.").email("Invalid email address."),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    auth_user_id: zod_1.z.string().uuid().optional().nullable(),
});
