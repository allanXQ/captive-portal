require("dotenv").config();
const { default: mongoose } = require("mongoose");
const { sendSMS } = require("../../utils/sendsms");
const crypto = require("crypto");

const fs = require("fs");

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

const generateRandomCode = () => {
  const min = 1000;
  const max = 9999;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const darajaWebhook = async (req, res) => {
  try {
    const ip = req.headers["x-forwarded-for"]
      ?.split(",")
      ?.map((ip) => ip.trim())[1];
    if (!whitelist.includes(ip)) {
      return res.status(403).json({ message: "You are not allowed" });
    }
    const { Body } = req.body;
    if (Body.stkCallback.ResultCode !== 0) {
      return res.status(400).json({ message: "payment failed" });
    }
    const Amount = Body.stkCallback.CallbackMetadata.Item[0].Value;
    const MpesaReceiptNumber = Body.stkCallback.CallbackMetadata.Item[1].Value;
    const TransactionDate = Body.stkCallback.CallbackMetadata.Item[3].Value;
    const Msisdn = Body.stkCallback.CallbackMetadata.Item[4].Value;

    const randomCode = generateRandomCode();

    const body = `You booking confirmation code is- ${randomCode}. Please keep it safe. Thank you for using our services.`;

    await sendSMS(body, Msisdn);

    return res.status(200).json({ message: "payment success" });
  } catch (error) {
    console.log(error);
  }
};

module.exports = { darajaWebhook };
