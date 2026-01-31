"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsersController = exports.getUserController = exports.getMeController = void 0;
const users_services_1 = require("./users_services");
const userService = new users_services_1.UserService();
/**
 * Get current user profile
 */
const getMeController = async (req, res) => {
    res.status(200).json({
        success: true,
        message: "User fetched successfully",
        data: req.user,
    });
};
exports.getMeController = getMeController;
/**
 * Get user by ID
 */
const getUserController = async (req, res) => {
    const userId = req.params.id;
    const user = await userService.getUserById(userId);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found",
        });
    }
    res.status(200).json({
        success: true,
        message: "User fetched successfully",
        data: user,
    });
};
exports.getUserController = getUserController;
/**
 * Get all users in organization
 */
const getAllUsersController = async (req, res) => {
    const users = await userService.getAllUsers();
    res.status(200).json({
        success: true,
        message: "Users fetched successfully",
        data: users,
    });
};
exports.getAllUsersController = getAllUsersController;
