require("dotenv/config");
const axios = require("axios");

const generateAccessToken = async () => {
  const consumerKey = process.env.SAFARICOM_CONSUMER_KEY;
  const consumerSecret = process.env.SAFARICOM_CONSUMER_SECRET;
  const url =
    "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
  const auth =
    "Basic " +
    new Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: auth,
      },
    });

    const dataresponse = response.data;
    const accessToken = dataresponse.access_token;
    return accessToken;
  } catch (error) {
    return error.message;
  }
};

module.exports = generateAccessToken;
