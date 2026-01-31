const { NodeSSH } = require("node-ssh");
const { router_creds } = require("./envs");

class RouterSSHClient {
  constructor() {
    this.ssh = new NodeSSH();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000; // 5 seconds
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Handle connection errors to prevent crashes
    this.ssh.connection?.on("error", (err) => {
      console.error("SSH connection error:", err.message);
      this.isConnected = false;
      this.handleDisconnection();
    });

    this.ssh.connection?.on("close", () => {
      console.log("SSH connection closed");
      this.isConnected = false;
      this.handleDisconnection();
    });

    this.ssh.connection?.on("timeout", () => {
      console.log("SSH connection timeout");
      this.isConnected = false;
      this.handleDisconnection();
    });
  }

  async handleDisconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect to SSH (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`,
      );

      setTimeout(async () => {
        try {
          await this.connect();
          this.reconnectAttempts = 0; // Reset on successful connection
        } catch (error) {
          console.error(
            `Reconnection attempt ${this.reconnectAttempts} failed:`,
            error.message,
          );
        }
      }, this.reconnectDelay);
    } else {
      console.error(
        "Maximum reconnection attempts reached. SSH connection lost permanently.",
      );
    }
  }

  async connect() {
    if (this.isConnected) return;

    try {
      // Dispose any existing connection
      if (this.ssh.connection) {
        this.ssh.dispose();
        this.ssh = new NodeSSH();
      }

      await this.ssh.connect({
        ...router_creds,
        keepaliveInterval: 30000, // Increased to 30 seconds
        keepaliveCountMax: 3,
        readyTimeout: 20000, // 20 second timeout for connection
        algorithms: {
          // Use more reliable algorithms
          serverHostKey: [
            "ssh-rsa",
            "ecdsa-sha2-nistp256",
            "ecdsa-sha2-nistp384",
            "ecdsa-sha2-nistp521",
          ],
          kex: [
            "diffie-hellman-group14-sha256",
            "ecdh-sha2-nistp256",
            "ecdh-sha2-nistp384",
            "ecdh-sha2-nistp521",
          ],
          cipher: ["aes128-ctr", "aes192-ctr", "aes256-ctr"],
          hmac: ["hmac-sha2-256", "hmac-sha2-512", "hmac-sha1"],
        },
      });

      this.isConnected = true;
      this.setupEventHandlers(); // Re-setup handlers for new connection
      console.log("SSH connected to router");
    } catch (error) {
      console.error("SSH connection failed:", error.message);
      this.isConnected = false;
      process.exit(0);
    }
  }

  async executeCommand(command) {
    let retries = 2;

    while (retries > 0) {
      try {
        if (!this.isConnected) {
          await this.connect();
        }

        const result = await this.ssh.execCommand(command);
        return result;
      } catch (error) {
        console.error(`Command execution failed: ${error.message}`);
        this.isConnected = false;
        retries--;

        if (retries > 0) {
          console.log(
            `Retrying command execution... (${retries} attempts left)`,
          );
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retry
        } else {
          console.error(
            `Command execution failed after all retries: ${command}`,
          );
          throw error;
        }
      }
    }
  }

  async authenticateUser(macAddress) {
    try {
      macAddress = macAddress.toLowerCase();
      return await this.executeCommand(`ndsctl auth ${macAddress}`);
    } catch (error) {
      console.error(
        `Failed to authenticate user ${macAddress}:`,
        error.message,
      );
      throw error;
    }
  }

  async deauthenticateUser(macAddress) {
    try {
      macAddress = macAddress.toLowerCase();
      return await this.executeCommand(`ndsctl deauth ${macAddress}`);
    } catch (error) {
      console.error(
        `Failed to deauthenticate user ${macAddress}:`,
        error.message,
      );
      throw error;
    }
  }

  async getStatus() {
    try {
      return await this.executeCommand("ndsctl status");
    } catch (error) {
      console.error("Failed to get router status:", error.message);
      throw error;
    }
  }

  async getClients() {
    try {
      return await this.executeCommand("ndsctl json");
    } catch (error) {
      console.error("Failed to get router clients:", error.message);
      throw error;
    }
  }

  isConnectionHealthy() {
    return (
      this.isConnected && this.ssh.connection && !this.ssh.connection.destroyed
    );
  }

  disconnect() {
    if (this.isConnected) {
      try {
        this.ssh.dispose();
      } catch (error) {
        console.error("Error during SSH disconnect:", error.message);
      }
      this.isConnected = false;
      console.log("SSH connection closed");
    }
  }
}

// Create singleton instance
const sshClient = new RouterSSHClient();

module.exports = sshClient;
