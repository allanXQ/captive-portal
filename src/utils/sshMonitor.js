const sshClient = require('../config/ssh');

class SSHMonitor {
  constructor() {
    this.monitoringInterval = null;
    this.checkInterval = 60000; // Check every minute
  }

  startMonitoring() {
    console.log('Starting SSH connection monitoring...');
    
    this.monitoringInterval = setInterval(async () => {
      if (!sshClient.isConnectionHealthy()) {
        console.log('SSH connection check: Connection not healthy');
        
        // Attempt to reconnect if not at max attempts
        if (sshClient.reconnectAttempts < sshClient.maxReconnectAttempts) {
          try {
            console.log('Attempting manual SSH reconnection...');
            await sshClient.connect();
            console.log('SSH connection restored successfully');
          } catch (error) {
            console.error('Manual SSH reconnection failed:', error.message);
          }
        }
      } else {
        // Optionally log healthy status (uncomment if needed)
        // console.log('SSH connection check: Connection healthy');
      }
    }, this.checkInterval);
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('SSH monitoring stopped');
    }
  }

  getConnectionStatus() {
    return {
      healthy: sshClient.isConnectionHealthy(),
      connected: sshClient.isConnected,
      reconnectAttempts: sshClient.reconnectAttempts,
      maxAttempts: sshClient.maxReconnectAttempts
    };
  }
}

const sshMonitor = new SSHMonitor();

module.exports = sshMonitor;
