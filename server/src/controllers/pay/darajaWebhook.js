require("dotenv").config();
const clients = require("../../models/clients");
const payments = require("../../models/payments");
const config = require("../../config");
const { authenticateUser } = require("../router");

const whitelist = [
  "196.201.214.200",
  "196.201.214.206",
  "196.201.213.114",
  "196.201.214.207",
  "196.201.214.208",
  "196.201.213.44",
  "196.201.212.127",
  "196.201.212.138",
  "196.201.212.129",
  "196.201.212.136",
  "196.201.212.74",
  "196.201.212.69",
];

const darajaWebhook = async (req, res) => {
  console.log("webhook called");
  // try {
  //   console.log("webhook called");
  //   const ip = req.headers["x-forwarded-for"]
  //     ?.split(",")
  //     ?.map((ip) => ip.trim())[1];
  //   if (!whitelist.includes(ip)) {
  //     return res.status(403).json({ message: "You are not allowed" });
  //   }
  //   const { Body } = req.body;
  //   if (Body.stkCallback.ResultCode !== 0) {
  //     return res.status(400).json({ message: "payment failed" });
  //   }
  //   const Amount = Body.stkCallback.CallbackMetadata.Item[0].Value;
  //   const MpesaReceiptNumber = Body.stkCallback.CallbackMetadata.Item[1].Value;
  //   const TransactionDate = Body.stkCallback.CallbackMetadata.Item[3].Value;
  //   const Msisdn = Body.stkCallback.CallbackMetadata.Item[4].Value;

  //   const payment = new payments({
  //     phoneNumber: Msisdn,
  //     amount: Amount,
  //     mpesaReceiptNumber: MpesaReceiptNumber,
  //     transactionDate: TransactionDate,
  //   });

  //   await payment.save();
  //   const package = Object.keys(config.packages).find(
  //     (key) => config.packages[key].price === parseInt(Amount)
  //   );

  //   const client = await clients.findOne({ phoneNumber: Msisdn }).lean();
  //   if (client.status === "active") {
  //     const newExpiry = new Date(
  //       new Date(client.expiryDate).getTime() + config.packages[package].expiry
  //     );
  //     await clients.findOneAndUpdate(
  //       { macAddress: client.macAddress },
  //       {
  //         currentSubscription: package,
  //         expiryDate: newExpiry,
  //       }
  //     );
  //   } else {
  //     authenticateUser(client.macAddress);
  //   }

  //   return res.status(200).json({ message: "payment success" });
  // } catch (error) {
  //   console.log(error);
  // }
};

module.exports = { darajaWebhook };
