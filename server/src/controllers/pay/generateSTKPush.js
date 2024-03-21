// controllers/lipanampesa.js
require("dotenv").config();
const axios = require("axios");

const { generateAccessToken } = require("../../utils/generateAccessToken");
const { getTimestamp } = require("../../utils/timestamp");
const config = require("../../config");

const generateSTKPush = async (req, res) => {
  try {
    const { phone, package, macadrress } = req.body;
    const amount = config.packages[package].price;
    console.log(phone, amount, macadrress);

    const accessToken = await generateAccessToken();
    const timestamp = getTimestamp();
    const url = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
    const auth = `Bearer ${accessToken}`;
    const password = Buffer.from(
      `${process.env.BUSINESS_SHORT_CODE}${process.env.PASSKEY}${timestamp}`
    ).toString("base64");

    const stkpush = await axios.post(
      url,
      {
        BusinessShortCode: process.env.BUSINESS_SHORT_CODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerBuyGoodsOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: process.env.PARTYB,
        PhoneNumber: phone,
        CallBackURL:
          "https://booking-server-76dj.onrender.com/api/daraja/webhook",
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

    res.json(stkpush.data);
  } catch (error) {
    console.log(error?.response?.data);
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  generateSTKPush,
};
