import "dotenv/config";
import { app } from "@/app.js";
import { connectDB } from "@/config/database.js";
import { startMonitorScheduler } from "@/jobs/monitor.scheduler.js";
import { PORT } from "@/config/consonants.js";

const startServer = async () => {
  try {
    await connectDB(); // Connect to the database
    startMonitorScheduler(); // Start the monitor scheduler
    app.listen(PORT, () => {
      console.log(`Server running on port http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
