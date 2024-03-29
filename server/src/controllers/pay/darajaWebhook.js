require("dotenv").config();
const clients = require("../../models/clients");
const payments = require("../../models/payments");
const config = require("../../config");
const { authenticateUser } = require("../router");

const darajaWebhook = async (req, res) => {
  try {
    const { phoneNumber, amount, mpesaReceiptNumber, transactionDate } =
      req.body;

    const payment = new payments({
      phoneNumber,
      amount,
      mpesaReceiptNumber,
      transactionDate,
    });

    await payment.save();
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
      client.currentSubscription = package;
      client.status = "active";
      client.expiryDate = new Date(
        Date.now() + config.packages[package].expiry
      );
      await client.save();
      authenticateUser(client.macAddress);
    }

    return res.status(200).json({ message: "payment success" });
  } catch (error) {
    console.log(error);
  }
};

module.exports = { darajaWebhook };
