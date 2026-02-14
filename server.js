require("dotenv").config();
const express = require("express");
const cors = require("cors");
const getSshClient = require("./src/config/ssh");
const { mongoClient } = require("./src/config/db");
const { initAgenda } = require("./src/tasks/agenda");

const app = express();
const sshClient = getSshClient();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    //all
    origin: "*",
  }),
);

// Health check endpoint
app.get("/health", (req, res) => {
  const health = {
    status: "OK",
    timestamp: new Date().toISOString(),
    ssh: {
      connected: sshClient.isConnectionHealthy(),
      reconnectAttempts: sshClient.reconnectAttempts,
      maxAttempts: sshClient.maxReconnectAttempts,
    },
  };

  res.status(200).json(health);
});

app.use("/api/v1", require("./src/routes/index"));

const port = process.env.PORT || 5000;

async function startServer() {
  try {
    await mongoClient();
    await sshClient.connect();

    process.on("SIGINT", gracefulShutdown);
    process.on("SIGTERM", gracefulShutdown);

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
    await initAgenda();
  } catch (error) {
    console.error("Failed to start server:", error);
    throw error;
  }
}

function gracefulShutdown() {
  console.log("\nGracefully shutting down server...");

  // Close SSH connection
  try {
    sshClient.disconnect();
    console.log("SSH connection closed");
  } catch (error) {
    console.error("Error closing SSH connection:", error.message);
  }

  // Exit the process
  process.exit(0);
}

startServer().catch((error) => {
  console.error("Fatal startup error:", error);
  process.exit(1);
});
