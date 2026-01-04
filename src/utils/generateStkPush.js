const axios = require("axios");
const { generateAccessToken } = require("./generateAccessToken");
const { getTimestamp } = require("./timestamp");

const generateStkPush = async (phoneNumber, amount) => {
    const accessToken = await generateAccessToken();
    const timestamp = getTimestamp();
    const url = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
    const auth = `Bearer ${accessToken}`;
    const password = Buffer.from(
      `${process.env.BUSINESS_SHORT_CODE}${process.env.PASSKEY}${timestamp}`
    ).toString("base64");

    const callbackUrl = "https://tinywebhook.onrender.com/api/daraja/webhook";

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
        CallBackURL: callbackUrl,
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
}

module.exports = {
    generateStkPush,
};