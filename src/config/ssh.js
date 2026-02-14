const { NodeSSH } = require("node-ssh");
const { router_creds } = require("./envs");

class RouterSSHClient {
  constructor() {
    this.ssh = new NodeSSH();

    this.isConnected = false;
    this.connectingPromise = null;

    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.baseReconnectDelay = 5000;

    this.commandQueue = Promise.resolve();

    this.setupProcessHooks();
  }

  /* ------------------------------------------------------------------ */
  /* CONNECTION MANAGEMENT */
  /* ------------------------------------------------------------------ */

  async connect() {
    if (this.isConnectionHealthy()) return;
    if (this.connectingPromise) return this.connectingPromise;

    this.connectingPromise = (async () => {
      try {
        if (this.ssh.connection) {
          this.ssh.dispose();
          this.ssh = new NodeSSH();
        }

        await this.ssh.connect({
          ...router_creds,
          keepaliveInterval: 30000,
          keepaliveCountMax: 3,
          readyTimeout: 20000,
          algorithms: {
            serverHostKey: [
              "ssh-rsa", // ← REQUIRED for many routers
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
        this.reconnectAttempts = 0;

        this.setupEventHandlers();

        console.log("✅ SSH connected to router");
      } catch (error) {
        this.isConnected = false;
        console.error("❌ SSH connection failed:", error.message);
        throw error;
      } finally {
        this.connectingPromise = null;
      }
    })();

    return this.connectingPromise;
  }

  setupEventHandlers() {
    const conn = this.ssh.connection;
    if (!conn) return;

    conn.removeAllListeners("error");
    conn.removeAllListeners("close");
    conn.removeAllListeners("timeout");

    conn.on("error", (err) => {
      console.error("SSH error:", err.message);
      this.handleDisconnection();
    });

    conn.on("close", () => {
      console.warn("SSH connection closed");
      this.handleDisconnection();
    });

    conn.on("timeout", () => {
      console.warn("SSH timeout");
      this.handleDisconnection();
    });
  }

  async handleDisconnection() {
    this.isConnected = false;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("🚨 Max reconnection attempts reached. Giving up.");
      return;
    }

    this.reconnectAttempts++;

    const delay = Math.min(
      60000,
      this.baseReconnectDelay * 2 ** (this.reconnectAttempts - 1),
    );

    console.log(
      `🔁 Reconnecting attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`,
    );

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (err) {
        console.error("Reconnect failed:", err.message);
      }
    }, delay);
  }

  isConnectionHealthy() {
    return (
      this.isConnected &&
      this.ssh.connection &&
      !this.ssh.connection.destroyed &&
      this.ssh.connection.writable
    );
  }

  disconnect() {
    if (!this.isConnected) return;

    try {
      this.ssh.dispose();
      console.log("🔌 SSH disconnected");
    } catch (err) {
      console.error("Error during disconnect:", err.message);
    }

    this.isConnected = false;
  }

  setupProcessHooks() {
    process.on("SIGINT", () => this.disconnect());
    process.on("SIGTERM", () => this.disconnect());
  }

  /* ------------------------------------------------------------------ */
  /* COMMAND EXECUTION */
  /* ------------------------------------------------------------------ */

  enqueue(taskFn) {
    this.commandQueue = this.commandQueue.then(taskFn).catch(() => {});
    return this.commandQueue;
  }

  async execWithTimeout(command, timeout = 10000) {
    return Promise.race([
      this.ssh.execCommand(command),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Command timeout")), timeout),
      ),
    ]);
  }

  async executeCommand(command) {
    return this.enqueue(async () => {
      let retries = 2;

      while (retries > 0) {
        try {
          if (!this.isConnectionHealthy()) {
            await this.connect();
          }

          const result = await this.execWithTimeout(command);

          return result;
        } catch (error) {
          retries--;
          this.isConnected = false;

          console.error(
            `Command failed (${command}) - retries left: ${retries}`,
            error.message,
          );

          if (retries === 0) {
            throw error;
          }

          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* ROUTER OPERATIONS */
  /* ------------------------------------------------------------------ */

  normalizeMac(mac) {
    if (!mac) throw new Error("MAC address required");

    const cleaned = mac.toLowerCase().replace(/[^a-f0-9:]/g, "");

    if (!/^([0-9a-f]{2}:){5}[0-9a-f]{2}$/.test(cleaned)) {
      throw new Error(`Invalid MAC address: ${mac}`);
    }

    return cleaned;
  }

  async authenticateUser(mac) {
    const normalized = this.normalizeMac(mac);
    return this.executeCommand(`ndsctl auth ${normalized}`);
  }

  async deauthenticateUser(mac) {
    const normalized = this.normalizeMac(mac);
    return this.executeCommand(`ndsctl deauth ${normalized}`);
  }

  async getStatus() {
    return this.executeCommand("ndsctl status");
  }

  async getClients() {
    return this.executeCommand("ndsctl json");
  }
}

/* ------------------------------------------------------------------ */
/* SINGLETON EXPORT */
/* ------------------------------------------------------------------ */

let instance;

module.exports = () => {
  if (!instance) {
    instance = new RouterSSHClient();
  }
  return instance;
};
