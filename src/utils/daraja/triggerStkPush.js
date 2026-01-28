const { default: mongoose } = require("mongoose");
const axios = require("axios");
const { Transactions } = require("../../../models");
const config = require("../../config");
const Clients = require("../../models/clients");
const generateAccessToken = require("./generateAccessToken");
const getTimeStamp = require("./timestamp");

const triggerStkPush = async (phoneNumber, amount) => {
  const accessToken = await generateAccessToken();
  const timestamp = getTimeStamp();
  const url = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
  const auth = `Bearer ${accessToken}`;
  const password = Buffer.from(
    `${process.env.BUSINESS_SHORT_CODE}${process.env.PASSKEY}${timestamp}`,
  ).toString("base64");
  const CallBackURL = `${process.env.BASE_URL}/api/v1/daraja/c2b-webhook`;
  let stkResponse = {};

  try {
    stkResponse = await axios.post(
      url,
      {
        BusinessShortCode: process.env.BUSINESS_SHORT_CODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: process.env.PARTYB,
        PhoneNumber: phoneNumber,
        CallBackURL,
        AccountReference: "test",
        TransactionDesc: "Mpesa Daraja API stk push test",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: auth,
        },
      },
    );
    // log response
  } catch (error) {
    throw new Error(error);
  }

  if (stkResponse.data.ResponseCode !== "0") {
    // log failed transaction attempt
    throw new Error("Failed to initiate transaction");
  }

  await Transactions.create({
    Amount: amount,
    PhoneNumber: phoneNumber,
    MerchantRequestID: stkResponse.data.MerchantRequestID,
    CheckoutRequestID: stkResponse.data.CheckoutRequestID,
  });

  return { data: stkResponse.data };
};

module.exports = triggerStkPush;
