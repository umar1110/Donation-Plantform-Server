import { SchemaMigrationManager } from "../utils/schema-migration-manager";
import logger from "../utils/logger";
async function runAllPublicMigrations() {
  try {
    const manager = new SchemaMigrationManager();
    await manager.runPublicMigrations();
  } catch (error) {
    logger.error("Public migrations failed:", error);
    throw error;
  }
}

if (require.main === module) {
  runAllPublicMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { runAllPublicMigrations };