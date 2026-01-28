import { SchemaMigrationManager } from '../utils/schema-migration-manager';
import logger  from '../utils/logger';
import { closeDatabaseConnection } from '../config/database';

async function showMigrationStatus() {
    try {
        const manager = new SchemaMigrationManager();
        
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
        } else {
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
        
    } catch (error) {
        logger.error('Error showing migration status:', error);
        throw error;
    } finally {
        await closeDatabaseConnection();
    }
}

if (require.main === module) {
    showMigrationStatus()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

export { showMigrationStatus };