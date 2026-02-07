const sshClient = require("../../config/ssh");
const ActionQueue = require("../../models/actionQueue");
const clients = require("../../models/clients");

async function userAuth(clientId, action) {
  const client = await clients.findOne({ _id: clientId });
  if (!client) {
    throw new Error("Client not found for authentication");
  }

  // Try to authenticate user, but don't fail if SSH is down
  // TODO: Implement checker for failed auth attempts
  try {
    if (sshClient.isConnectionHealthy()) {
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
    } else {
      throw new Error("SSH connection is not healthy");
    }
  } catch (sshError) {
    console.error("Failed to authenticate user via SSH:", sshError);
    queueAction(clientId, action, new Date(Date.now() + 5 * 60 * 1000)); // Retry after 5 minutes
    throw new Error(sshError);
  }
}

async function queueAction(clientId, action, triggerAt) {
  // TODO: Rethink this
  try {
    const queueAction = ActionQueue({
      clientId,
      action,
      triggerAt,
    });
    await queueAction.save();
  } catch (error) {}
}

module.exports = userAuth;
