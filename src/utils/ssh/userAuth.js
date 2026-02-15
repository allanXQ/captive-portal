const getSshClient = require("../../config/ssh");
const clients = require("../../models/clients");

async function userAuth(clientId, action) {
  const sshClient = getSshClient();
  console.log(`🔗 Using SSH instance: ${sshClient.instanceId}`);

  const client = await clients.findOne({ _id: clientId });
  if (!client) {
    throw new Error("Client not found for authentication");
  }

  // Try to authenticate user, but don't fail if SSH is down
  // TODO: Implement checker for failed auth attempts
  try {
    switch (action) {
      case "AUTH":
        await sshClient.authenticateUser(client.macAddress);
        break;
      //TODO: Log auth
      case "DEAUTH":
        await sshClient.deauthenticateUser(client.macAddress);
        break;
      default:
        throw new Error(`Unknown action for user authentication: ${action}`);
    }
  } catch (sshError) {
    console.error("Failed to authenticate user via SSH:", sshError);
    throw new Error(sshError);
  }
}

module.exports = userAuth;
