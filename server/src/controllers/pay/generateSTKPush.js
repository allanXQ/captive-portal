// controllers/lipanampesa.js
require("dotenv").config();
const axios = require("axios");

const { generateAccessToken } = require("../../utils/generateAccessToken");
const { getTimestamp } = require("../../utils/timestamp");
const config = require("../../config");
const Clients = require("../../models/clients");

const generateSTKPush = async (req, res) => {
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
        status: "inactive",
        expiryDate: new Date(Date.now() + config.packages[package].expiry),
      });
      await newClient.save();
    }

    const accessToken = await generateAccessToken();
    const timestamp = getTimestamp();
    const url = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
    const auth = `Bearer ${accessToken}`;
    const password = Buffer.from(
      `${process.env.BUSINESS_SHORT_CODE}${process.env.PASSKEY}${timestamp}`
    ).toString("base64");

    await axios.post(
      url,
      {
        BusinessShortCode: process.env.BUSINESS_SHORT_CODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerBuyGoodsOnline",
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: process.env.PARTYB,
        PhoneNumber: phoneNumber,
        CallBackURL: `https://44.217.48.200:${
          process.env.PORT || 5000
        }/api/daraja/webhook`,
        AccountReference: "test",
        TransactionDesc: "Mpesa Daraja API stk push test",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: auth,
        },
      }
    );

    return res.status(200).json({
      message:
        "Stk push sent. Once payment is done internet access will be automatically allowed",
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  generateSTKPush,
};
