import "dotenv/config";
import { app } from "@/app.js";
import { connectDB } from "@/config/database.js";
import { PORT } from "@/config/consonants.js";

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port https://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();