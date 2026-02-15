const getSshClient = require("../../config/ssh");
const clients = require("../../models/clients");

async function userAuth(clientId, action) {
  const sshClient = getSshClient();
  console.log(`🔗 Using SSH instance: ${sshClient.instanceId}`);

  const client = await clients.findOne({ _id: clientId });
  if (!client) {
    return {
      status: "error",
      message: `Client with ID ${clientId} not found`,
      data: null,
    };
  }

  // Try to authenticate user, but don't fail if SSH is down
  // TODO: Implement checker for failed auth attempts
  try {
    switch (action) {
      case "AUTH": {
        const result = await sshClient.authenticateUser(client.macAddress);
        if (result && result.code === 0) {
          return {
            status: "success",
            message: `Client ${client.macAddress} authenticated successfully`,
            data: result,
          };
        }
        return {
          status: "error",
          message: `Authentication failed for ${client.macAddress}`,
          data: result || null,
        };
      }
      //TODO: Log auth
      case "DEAUTH": {
        const deauthResult = await sshClient.deauthenticateUser(
          client.macAddress,
        );
        if (deauthResult && deauthResult.code === 0) {
          return {
            status: "success",
            message: `Client ${client.macAddress} deauthenticated successfully`,
            data: deauthResult,
          };
        }
        return {
          status: "error",
          message: `Deauthentication failed for ${client.macAddress}`,
          data: deauthResult || null,
        };
      }
      default:
        return {
          status: "error",
          message: `Unknown action: ${action}`,
          data: null,
        };
    }
  } catch (sshError) {
    console.error("Failed to authenticate user via SSH:", sshError);
    return {
      status: "error",
      message: sshError?.message || String(sshError),
      data: null,
    };
  }
}

module.exports = userAuth;
