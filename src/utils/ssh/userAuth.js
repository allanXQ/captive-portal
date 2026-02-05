const sshClient = require("../../config/ssh");
const clients = require("../../models/clients");

async function userAuth(clientId) {
  const client = await clients.findOne({ _id: clientId });
  if (!client) {
    throw new Error("Client not found for authentication");
  }

  // Try to authenticate user, but don't fail if SSH is down
  // TODO: Implement checker for failed auth attempts
  try {
    if (sshClient.isConnectionHealthy()) {
      await sshClient.authenticateUser(client.macAddress);
      console.log("User authenticated successfully");
    } else {
      console.warn(
        "SSH connection not available, user will be authenticated when connection is restored",
      );
    }
  } catch (sshError) {
    console.error("Failed to authenticate user via SSH:", sshError.message);
    // Continue processing payment even if SSH authentication fails
  }
}

module.exports = userAuth;
