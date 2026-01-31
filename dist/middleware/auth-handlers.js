"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireOrgAdmin = requireOrgAdmin;
const supabase_1 = require("../config/supabase");
const apiError_1 = require("../utils/apiError");
const users_respository_1 = require("../modules/users/users_respository");
async function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new apiError_1.ApiError(401, "Login required to access this resource");
        }
        const accessToken = authHeader.replace("Bearer ", "").trim();
        // Verify token with Supabase
        const { data, error } = await supabase_1.supabaseAdmin.auth.getUser(accessToken);
        if (error || !data.user) {
            throw new apiError_1.ApiError(401, "Invalid or expired access token");
        }
        // Fetch user profile from org schema
        const user = await (0, users_respository_1.selectUserByAuthId)(data.user.id);
        if (!user) {
            throw new apiError_1.ApiError(404, "User profile not found in organization");
        }
        // Attach user and org
        req.user = user;
        next();
    }
    catch (err) {
        next(err);
    }
}
async function requireOrgAdmin(req, res, next) {
    try {
        if (!req.user) {
            throw new apiError_1.ApiError(401, "Authentication required");
        }
        if (!req.user.is_organization_admin) {
            throw new apiError_1.ApiError(403, "Organization admin access required");
        }
        next();
    }
    catch (err) {
        next(err);
    }
}
