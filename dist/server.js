"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const PORT = process.env.PORT || 4000;
async function initializeServer() {
    const dbConnected = await (0, database_1.testDatabaseConnection)();
    if (!dbConnected) {
        console.error("Failed to connect to the database. Exiting...");
        process.exit(1);
    }
    app_1.default.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
initializeServer();
