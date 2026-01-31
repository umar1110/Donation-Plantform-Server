"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateAllSchemas = migrateAllSchemas;
const schema_migration_manager_1 = require("../utils/schema-migration-manager");
const logger_1 = __importDefault(require("../utils/logger"));
const database_1 = require("../config/database");
async function migrateAllSchemas() {
    try {
        const manager = new schema_migration_manager_1.SchemaMigrationManager();
        // Initialize tracking
        await manager.initializeMigrationTracking();
        logger_1.default.info('Starting schema migrations for all orgs...');
        // Apply to all orgs
        const results = await manager.applyToAllOrgs();
        // Show results
        console.log('\n=== Migration Results ===');
        for (const result of results) {
            console.log(`${result.schema}: ${result.count} migrations applied`);
        }
        // Show status
        const status = await manager.getMigrationStatus();
        console.log('\n=== Migration Status ===');
        for (const s of status) {
            console.log(`${s.schema}: v${s.current_version}/${s.latest_version} ` +
                `(${s.pending} pending)`);
        }
        logger_1.default.info('All migrations completed');
    }
    catch (error) {
        logger_1.default.error('Migration failed:', error);
        throw error;
    }
    finally {
        await (0, database_1.closeDatabaseConnection)();
    }
}
if (require.main === module) {
    migrateAllSchemas()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
