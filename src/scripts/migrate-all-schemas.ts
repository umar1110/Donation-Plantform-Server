import { SchemaMigrationManager } from '../utils/schema-migration-manager';
import  logger  from '../utils/logger';
import { closeDatabaseConnection } from '../config/database';

async function migrateAllSchemas() {
    try {
        const manager = new SchemaMigrationManager();
        
        // Initialize tracking
        await manager.initializeMigrationTracking();
        
        logger.info('Starting schema migrations for all orgss...');
        
        // Apply to all orgss
        const results = await manager.applyToAllOrgss();
        
        // Show results
        console.log('\n=== Migration Results ===');
        for (const result of results) {
            console.log(`${result.schema}: ${result.count} migrations applied`);
        }
        
        // Show status
        const status = await manager.getMigrationStatus();
        console.log('\n=== Migration Status ===');
        for (const s of status) {
            console.log(
                `${s.schema}: v${s.current_version}/${s.latest_version} ` +
                `(${s.pending} pending)`
            );
        }
        
        logger.info('All migrations completed');
    } catch (error) {
        logger.error('Migration failed:', error);
        throw error;
    } finally {
        await closeDatabaseConnection();
    }
}

if (require.main === module) {
    migrateAllSchemas()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

export { migrateAllSchemas };