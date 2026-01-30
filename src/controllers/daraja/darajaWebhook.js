// const clients = require("../../models/clients");
// const config = require("../../config");
// const sshClient = require("../../config/ssh");
// const { authenticateUser } = require("../router");

const darajaWebhook = async (req, res) => {
  try {
    //transactions
    const { phoneNumber, amount, mpesaReceiptNumber, transactionDate } =
      req.body;

    console.log("Received Daraja webhook:", req.body);

    // const client = await clients.findOne({ phoneNumber })

    // Try to authenticate user, but don't fail if SSH is down
    // try {
    //   if (sshClient.isConnectionHealthy()) {
    //     await sshClient.authenticateUser(client.macAddress);
    //     console.log("User authenticated successfully");
    //   } else {
    //     console.warn("SSH connection not available, user will be authenticated when connection is restored");
    //   }
    // } catch (sshError) {
    //   console.error("Failed to authenticate user via SSH:", sshError.message);
    //   // Continue processing payment even if SSH authentication fails
    // }

    return res.status(200).json({ message: "payment success" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({ message: "payment processing failed" });
  }
};

module.exports = { darajaWebhook };
