require("dotenv").config();
const clients = require("../../models/clients");
const payments = require("../../models/payments");
const config = require("../../config");
const sshClient = require("../../config/ssh");
// const { authenticateUser } = require("../router");


const darajaWebhook = async (req, res) => {
  try {
    //transactions
    const { phoneNumber, amount, mpesaReceiptNumber, transactionDate } =
      req.body;

    await payments.create({
      phoneNumber,
      amount,
      mpesaReceiptNumber,
      transactionDate,
    });

    const package = Object.keys(config.packages).find(
      (key) => config.packages[key].price === parseInt(amount)
    );

    const client = await clients.findOne({ phoneNumber }).lean();
    if (client.status === "active") {
      const newExpiry = new Date(
        new Date(client.expiryDate).getTime() + config.packages[package].expiry
      );
      await clients.findOneAndUpdate(
        { macAddress: client.macAddress },
        {
          currentSubscription: package,
          expiryDate: newExpiry,
        }
      );
    } else {
      await clients.findOneAndUpdate(
        { macAddress: client.macAddress },
        {
          currentSubscription: package,
          expiryDate: new Date(Date.now() + config.packages[package].expiry),
          status: "active",
        }
      );
      
      // Try to authenticate user, but don't fail if SSH is down
      try {
        if (sshClient.isConnectionHealthy()) {
          await sshClient.authenticateUser(client.macAddress);
          console.log("User authenticated successfully");
        } else {
          console.warn("SSH connection not available, user will be authenticated when connection is restored");
        }
      } catch (sshError) {
        console.error("Failed to authenticate user via SSH:", sshError.message);
        // Continue processing payment even if SSH authentication fails
      }
    }

    return res.status(200).json({ message: "payment success" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({ message: "payment processing failed" });
  }
};

module.exports = { darajaWebhook };
