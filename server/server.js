require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sshClient = require("./src/config/ssh");
const { mongoClient } = require("./src/config/db");
const sshMonitor = require("./src/utils/sshMonitor");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    //all
    origin: "*",
  })
);

// Health check endpoint
app.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    ssh: {
      connected: sshClient.isConnectionHealthy(),
      reconnectAttempts: sshClient.reconnectAttempts,
      maxAttempts: sshClient.maxReconnectAttempts
    }
  };
  
  res.status(200).json(health);
});

app.use("/api", require("./src/routes/index"));

const port = process.env.PORT || 5000;

async function startServer() {
  try {
    // Connect to MongoDB first
    await mongoClient();
    
    // Try to connect to SSH, but don't fail if it's not available
    try {
      await sshClient.connect();
    } catch (sshError) {
      console.warn('SSH connection failed during startup:', sshError.message);
      console.warn('Server will continue running, SSH will retry connection automatically');
    }

    // Add global error handlers to prevent crashes
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      // Don't exit the process for SSH-related errors
      if (!error.message.includes('Keepalive timeout') && !error.message.includes('SSH')) {
        console.error('Fatal error occurred, exiting...');
        process.exit(1);
      }
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Don't exit for SSH-related rejections
      if (!String(reason).includes('SSH') && !String(reason).includes('Keepalive')) {
        console.error('Fatal rejection occurred, exiting...');
        process.exit(1);
      }
    });

    // Graceful shutdown handling
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      
      // Start SSH connection monitoring
      sshMonitor.startMonitoring();
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    throw error;
  }
}

function gracefulShutdown() {
  console.log('\nGracefully shutting down server...');
  
  // Stop SSH monitoring
  sshMonitor.stopMonitoring();
  
  // Close SSH connection
  try {
    sshClient.disconnect();
  } catch (error) {
    console.error('Error closing SSH connection:', error.message);
  }
  
  // Exit the process
  process.exit(0);
}

startServer().catch(error => {
  console.error('Fatal startup error:', error);
  process.exit(1);
});
