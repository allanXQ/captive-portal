// controllers/lipanampesa.js
const { packages } = require("../../config");
// const Clients = require("../../models/clients");
const sshClient = require("../../config/ssh");
const Clients = require("../../models/clients");

const dummySubscribe = async (req, res) => {
  try {
    const { clientMac, clientIp, phoneNumber, packageName } = req.body;
    if (!packages.find((pkg) => pkg.name === packageName)) {
      return res.status(400).json({ error: "Invalid package name" });
    }
    const macAddress = clientMac;
    const client = await Clients.findOne({ macAddress }).lean();
    if (!client) {
      const newClient = new Clients({
        phoneNumber,
        ipAddress: clientIp,
        macAddress,
        currentSubscription: packageName,
        status: "pending-payment",
        expiryDate: new Date(
          Date.now() + packages.find((pkg) => pkg.name === packageName).expiry
        ),
      });
      await newClient.save();
    }

    // Try to authenticate user, but don't fail if SSH is down
    try {
      if (sshClient.isConnectionHealthy()) {
        await sshClient.authenticateUser(macAddress);
        console.log("User authenticated via dummy pay");
      } else {
        console.warn("SSH connection not available for dummy authentication");
      }
    } catch (sshError) {
      console.error(
        "Failed to authenticate user via SSH in dummy pay:",
        sshError.message
      );
      // Continue even if SSH authentication fails
    }

    // ADD SESSION TIME INCREMENT LOGIC
  } catch (error) {
    console.error("Dummy pay error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }

  return res.status(200).json({ message: "Dummy payment successful" });
};

module.exports = { dummySubscribe };
