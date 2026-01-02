const { NodeSSH } = require('node-ssh');

class RouterSSHClient {
  constructor() {
    this.ssh = new NodeSSH();
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) return;

    try {
      await this.ssh.connect({
        host: process.env.ROUTER_IP,
        port: process.env.ROUTER_PORT,
        username: "root",
        password: process.env.ROUTER_PASSWORD,
        keepaliveInterval: 10000, // Keep connection alive
        keepaliveCountMax: 3
      });
      this.isConnected = true;
      console.log('SSH connected to router');
    } catch (error) {
      console.error('SSH connection failed:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async executeCommand(command) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      
      const result = await this.ssh.execCommand(command);
      return result;
    } catch (error) {
      // Reconnect on failure
      this.isConnected = false;
      await this.connect();
      return await this.ssh.execCommand(command);
    }
  }

  async authenticateUser(macAddress) {
    macAddress = macAddress.toLowerCase();
    return await this.executeCommand(`ndsctl auth ${macAddress}`);
  }

  async deauthenticateUser(macAddress) {
    macAddress = macAddress.toLowerCase();
    return await this.executeCommand(`ndsctl deauth ${macAddress}`);
  }

  async getStatus() {
    return await this.executeCommand('ndsctl status');
  }

  disconnect() {
    if (this.isConnected) {
      this.ssh.dispose();
      this.isConnected = false;
    }
  }
}

// Create singleton instance
const routerSSH = new RouterSSHClient();

module.exports = routerSSH;