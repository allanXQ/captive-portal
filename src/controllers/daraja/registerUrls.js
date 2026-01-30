const axios = require("axios");
const generateAccessToken = require("../../utils/daraja/generateAccessToken");

const registerUrl = async (req, res) => {
  try {
    const {
      ConfirmationURL = "c2b-confirmation",
      ValidationURL = "c2b-validation",
    } = req.body;

    const accessToken = await generateAccessToken();
    const auth = `Bearer ${accessToken}`;
    const url = "https://api.safaricom.co.ke/mpesa/c2b/v2/registerurl";
    const response = await axios.post(
      url,
      {
        ShortCode: process.env.BUSINESS_SHORT_CODE,
        ResponseType: "Completed",
        ConfirmationURL: `${process.env.BASE_URL}/api/v1/${ConfirmationURL}`,
        ValidationURL: `${process.env.BASE_URL}/api/v1/${ValidationURL}`,
      },
      {
        headers: {
          Authorization: auth,
          "Content-Type": "application/json",
        },
      },
    );

    if (response.data.ResponseCode === "0") {
      return res.status(200).json({
        message: "URLs registered successfully",
        data: response.data,
      });
    }

    return res.status(400).json({
      message: "Failed to register URLs",
      data: response.data,
    });
  } catch (error) {
    error.context = {
      operation: "M-Pesa URL Registration",
      shortCode: process.env.BUSINESS_SHORT_CODE,
    };
    return res.status(500).json({
      error: "Internal server error during URL registration",
      details: error.message,
    });
  }
};

module.exports = registerUrl;
