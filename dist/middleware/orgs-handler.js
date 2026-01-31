"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orgsHandler = void 0;
const orgs_service_1 = require("../modules/orgs/orgs.service");
const orgsHandler = async (req, res, next) => {
    try {
        const orgId = req.headers["x-orgs-id"];
        if (!orgId) {
            return res.status(400).json({
                success: false,
                message: "Missing X-Orgs-ID header",
            });
        }
        const orgService = new orgs_service_1.OrgsService();
        const orgInfo = await orgService.getOrgInfo(orgId);
        if (!orgInfo) {
            return res.status(404).json({
                success: false,
                message: "Org not found",
            });
        }
        req.org = orgInfo;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.orgsHandler = orgsHandler;
