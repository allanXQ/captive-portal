// controllers/lipanampesa.js
const config = require("../../config");
const Clients = require("../../models/clients");
const sshClient = require("../../config/ssh");

const dummySubscribe = async (req, res) => {
  try {
    const { clientMac, clientIp, phoneNumber, packageName } = req.body;
    if (!config.packages[packageName]) {
      return res.status(400).json({ error: "Invalid package name" });
    }
    const macAddress = clientMac;
    const client = await Clients.findOne({ macAddress }).lean();
    // if (!client) {
    //   const newClient = new Clients({
    //     phoneNumber,
    //     ipAddress: clientIp,
    //     macAddress,
    //     currentSubscription: packageName,
    //     status: "pending-payment",
    //     expiryDate: new Date(Date.now() + config.packages[packageName].expiry),
    //   });
    //   await newClient.save();
    // }

    await sshClient.authenticateUser(macAddress);
    console.log("authenticated via dummy pay");
    // ADD SESSION TIME INCREMENT LOGIC
} catch (error) {
    console.error("Dummy pay error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }

  return res.status(200).json({ message: "Dummy payment successful" });
};

module.exports = { dummySubscribe };