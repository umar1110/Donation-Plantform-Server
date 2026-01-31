"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = void 0;
const zod_1 = require("zod");
exports.updateUserSchema = zod_1.z.object({
    first_name: zod_1.z.string().min(2).optional(),
    last_name: zod_1.z.string().min(2).optional(),
    is_organization_admin: zod_1.z.boolean().optional(),
});
