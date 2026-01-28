import app from "./app";
import { testDatabaseConnection } from "./config/database";

const PORT = process.env.PORT || 4000;

async function initializeServer() {
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.error("Failed to connect to the database. Exiting...");
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

initializeServer();
