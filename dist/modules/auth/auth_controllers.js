"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signInUser = void 0;
exports.refreshToken = refreshToken;
const auth_schema_1 = require("./auth_schema");
const supabase_1 = require("../../config/supabase");
const users_respository_1 = require("../users/users_respository");
const apiError_1 = require("../../utils/apiError");
/**
 * Sign in user with email and password
 */
const signInUser = async (req, res) => {
    const result = auth_schema_1.signInSchema.parse(req.body);
    const { data, error } = await supabase_1.supabase.auth.signInWithPassword({
        email: result.email,
        password: result.password,
    });
    if (error || !data.user) {
        return res.status(401).json({
            success: false,
            message: "Invalid credentials",
            errors: [error?.message],
        });
    }
    // Get user profile
    const userProfile = await (0, users_respository_1.selectUserByAuthId)(data.user.id);
    if (!userProfile) {
        return res.status(404).json({
            success: false,
            message: "User profile not found in organization",
        });
    }
    return res.status(200).json({
        success: true,
        message: "User signed in successfully",
        data: {
            user: userProfile,
            accessToken: data.session?.access_token,
            refreshToken: data.session?.refresh_token,
            expiresIn: data.session?.expires_in,
        },
    });
};
exports.signInUser = signInUser;
/**
 * Refresh access token
 */
async function refreshToken(req, res) {
    const { refresh_token } = req.body;
    if (!refresh_token) {
        throw new apiError_1.ApiError(400, "Refresh token is required");
    }
    const { data, error } = await supabase_1.supabase.auth.refreshSession({
        refresh_token,
    });
    if (error || !data.session) {
        throw new apiError_1.ApiError(401, "Invalid or expired refresh token");
    }
    return res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        data: {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresIn: data.session.expires_in,
        },
    });
}
