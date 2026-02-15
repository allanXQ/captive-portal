const router = require("express").Router();
const getSshClient = require("../config/ssh");
const { dummySubscribe } = require("../controllers/pay/dummySubscribe");
const { subscribe } = require("../controllers/subscribe");
const registerUrl = require("../controllers/daraja/registerUrls");
const { stkWebhook } = require("../controllers/daraja/stkWebhook");

const sshClient = getSshClient();

router.post("/dummy-subscribe", dummySubscribe); // For testing purposes
router.post("/subscribe", subscribe);
// router.post("/register-urls", registerUrl);
// router.post("/stk-webhook", stkWebhook);
// router.post("/c2b-validation", stkWebhook);
router.post("/deauth", async (req, res) => {
  try {
    const { macAddress } = req.body;

    if (!macAddress) {
      return res.status(400).json({
        error: "MAC address is required",
        success: false,
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
router.post("/auth", async (req, res) => {
  try {
    const { macAddress } = req.body;

    if (!macAddress) {
      return res.status(400).json({
        error: "MAC address is required",
        success: false,
      });
    }

    const result = await sshClient.authenticateUser(macAddress);

    return res.status(200).json({
      message: "User authenticated successfully",
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
  const config = require("../config/packages");
  return res.status(200).json({ packages: config.packages });
});

router.get("/router/status", async (req, res) => {
  try {
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
module.exports = router;
