// controllers/lipanampesa.js
const config = require("../../config");
const Clients = require("../../models/clients");
const sshClient = require("../../config/ssh");

const dummyPay = async (req, res) => {
  try {
    const { phoneNumber, package, macaddress } = req.body;
    const amount = config.packages[package].price;
    const macAddress = macaddress.toLowerCase();
    const client = await Clients.findOne({ macAddress }).lean();
    if (!client) {
      const newClient = new Clients({
        phoneNumber,
        macAddress,
        currentSubscription: package,
        status: "active",
        expiryDate: new Date(Date.now() + config.packages[package].expiry),
      });
      await newClient.save();
    }
    await sshClient.authenticateUser(macAddress);
    console.log("authenticated via dummy pay");
    // ADD SESSION TIME INCREMENT LOGIC
} catch (error) {
    console.error("Dummy pay error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }

  return res.status(200).json({ message: "Dummy payment successful" });
};

module.exports = { dummyPay };