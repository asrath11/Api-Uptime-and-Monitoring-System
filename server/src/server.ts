import "dotenv/config";
import { app } from "./app";
import { connectDB } from "./config/database";
import { PORT } from "./config/consonants";

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