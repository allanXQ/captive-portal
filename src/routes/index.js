const router = require("express").Router();
const sshClient = require("../config/ssh");
const sshMonitor = require("../utils/sshMonitor");
const { dummySubscribe } = require("../controllers/pay/dummySubscribe");
const { subscribe } = require("../controllers/subscribe");

// router.post("/subscribe", generateSTKPush);
router.post("/dummy-subscribe", dummySubscribe); // For testing purposes
router.post("/subscribe", subscribe);
router.post("/deauth", async (req, res) => {
  try {
    const { macAddress } = req.body;

    if (!macAddress) {
      return res.status(400).json({
        error: "MAC address is required",
        success: false,
      });
    }

    // Check if SSH is connected
    if (!sshClient.isConnectionHealthy()) {
      return res.status(503).json({
        error: "SSH connection to router is not available",
        success: false,
        message:
          "Please try again in a few moments as the system attempts to reconnect",
      });
    }

    const result = await sshClient.deauthenticateUser(macAddress);

    return res.status(200).json({
      message: "User deauthenticated successfully",
      success: true,
      macAddress: macAddress,
      result: result,
    });
  } catch (error) {
    console.error("Deauth error:", error.message);
    return res.status(500).json({
      error: "Failed to deauthenticate user",
      success: false,
      message: error.message,
    });
  }
});
router.get("/packages", (req, res) => {
  const config = require("../config");
  return res.status(200).json({ packages: config.packages });
});

router.get("/router/status", async (req, res) => {
  try {
    if (!sshClient.isConnectionHealthy()) {
      return res.status(503).json({
        error: "SSH connection to router is not available",
        success: false,
        connected: false,
      });
    }

    const status = await sshClient.getStatus();

    return res.status(200).json({
      success: true,
      connected: true,
      status: status,
    });
  } catch (error) {
    console.error("Router status error:", error.message);
    return res.status(500).json({
      error: "Failed to get router status",
      success: false,
      message: error.message,
    });
  }
});

router.get("/router/clients", async (req, res) => {
  try {
    if (!sshClient.isConnectionHealthy()) {
      return res.status(503).json({
        error: "SSH connection to router is not available",
        success: false,
        connected: false,
      });
    }

    const clients = await sshClient.getClients();

    return res.status(200).json({
      success: true,
      connected: true,
      clients: clients,
    });
  } catch (error) {
    console.error("Router status error:", error.message);
    return res.status(500).json({
      error: "Failed to get router status",
      success: false,
      message: error.message,
    });
  }
});

router.get("/ssh/status", (req, res) => {
  const status = sshMonitor.getConnectionStatus();

  return res.status(200).json({
    success: true,
    ssh: status,
  });
});

router.post("/ssh/reconnect", async (req, res) => {
  try {
    console.log("Manual SSH reconnection requested");
    await sshClient.connect();

    return res.status(200).json({
      success: true,
      message: "SSH reconnection successful",
      status: sshMonitor.getConnectionStatus(),
    });
  } catch (error) {
    console.error("Manual SSH reconnection failed:", error.message);
    return res.status(500).json({
      success: false,
      error: "SSH reconnection failed",
      message: error.message,
    });
  }
});
module.exports = router;
