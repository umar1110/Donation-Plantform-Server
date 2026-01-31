"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.showMigrationStatus = showMigrationStatus;
const schema_migration_manager_1 = require("../utils/schema-migration-manager");
const logger_1 = __importDefault(require("../utils/logger"));
const database_1 = require("../config/database");
async function showMigrationStatus() {
    try {
        const manager = new schema_migration_manager_1.SchemaMigrationManager();
        // Get available migrations
        const available = manager.getAvailableMigrations();
        console.log('\n=== Available Migrations ===');
        console.log(`Total: ${available.length}\n`);
        available.forEach(m => {
            console.log(`  ${m.version}. ${m.name}`);
        });
        // Get status for all orgs
        const status = await manager.getMigrationStatus();
        console.log('\n=== Orgs Schemas ===');
        if (status.length === 0) {
            console.log('  No orgs found');
        }
        else {
            const maxSchemaLen = Math.max(...status.map(s => s.schema.length));
            status.forEach(s => {
                const schemaName = s.schema.padEnd(maxSchemaLen);
                const version = `v${s.current_version}/${s.latest_version}`;
                const statusIcon = s.pending === 0 ? '✅' : '⚠️ ';
                const pendingText = s.pending > 0 ? ` (${s.pending} pending)` : '';
                console.log(`  ${schemaName}  ${version}  ${statusIcon}${pendingText}`);
            });
        }
        console.log('');
    }
    catch (error) {
        logger_1.default.error('Error showing migration status:', error);
        throw error;
    }
    finally {
        await (0, database_1.closeDatabaseConnection)();
    }
}
if (require.main === module) {
    showMigrationStatus()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
