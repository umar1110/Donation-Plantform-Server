"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerNewOrgs = registerNewOrgs;
const orgs_schema_1 = require("./orgs.schema");
const orgs_service_1 = require("./orgs.service");
const orgsService = new orgs_service_1.OrgsService();
async function registerNewOrgs(req, res) {
    const result = orgs_schema_1.createOrgsSchema.parse(req.body);
    const orgs = await orgsService.createOrgs(result);
    return res.status(201).json({
        success: true,
        message: "Orgs registered successfully",
        data: orgs,
    });
}
