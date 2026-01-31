"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const users_respository_1 = require("./users_respository");
const apiError_1 = require("../../utils/apiError");
class UserService {
    /**
     * Get user by ID
     */
    async getUserById(userId) {
        return (0, users_respository_1.selectUserById)(userId);
    }
    /**
     * Get all users in the organization
     */
    async getAllUsers() {
        return (0, users_respository_1.selectAllUsers)();
    }
    /**
     * Update user profile
     */
    async updateUser(userId, userData) {
        const existingUser = await (0, users_respository_1.selectUserById)(userId);
        if (!existingUser) {
            throw new apiError_1.ApiError(404, "User not found");
        }
        return (0, users_respository_1.updateUserProfile)(userId, {
            firstName: userData.first_name,
            lastName: userData.last_name,
            isOrganizationAdmin: userData.is_organization_admin,
        });
    }
}
exports.UserService = UserService;
