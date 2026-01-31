"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAllPublicMigrations = runAllPublicMigrations;
const schema_migration_manager_1 = require("../utils/schema-migration-manager");
const logger_1 = __importDefault(require("../utils/logger"));
async function runAllPublicMigrations() {
    try {
        const manager = new schema_migration_manager_1.SchemaMigrationManager();
        await manager.runPublicMigrations();
    }
    catch (error) {
        logger_1.default.error("Public migrations failed:", error);
        throw error;
    }
}
if (require.main === module) {
    runAllPublicMigrations()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
