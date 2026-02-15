const axios = require("axios");
const generateAccessToken = require("./generateAccessToken");
const getTimeStamp = require("./timestamp");

const queryStkStatus = async (checkoutRequestId) => {
  const accessToken = await generateAccessToken();
  const timestamp = getTimeStamp();
  const url = "https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query";
  const auth = `Bearer ${accessToken}`;
  const password = Buffer.from(
    `${process.env.BUSINESS_SHORT_CODE}${process.env.PASSKEY}${timestamp}`,
  ).toString("base64");

  try {
    const response = await axios.post(
      url,
      {
        BusinessShortCode: process.env.BUSINESS_SHORT_CODE,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: auth,
        },
      },
    );

    return {
      status: "success",
      data: response.data,
    };
  } catch (error) {
    return {
      status: "error",
      data: null,
      message:
        error.response?.data?.errorMessage || error.message || "Unknown error",
    };
  }
};

module.exports = queryStkStatus;
