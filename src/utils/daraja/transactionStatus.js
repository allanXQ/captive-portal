const axios = require("axios");
const transactions = require("../../models/transactions");
const sessions = require("../../models/sessions");
const mongoose = require("mongoose");
const { packages } = require("../../config/packages");
const userAuth = require("../../utils/ssh/userAuth");

const transactionStatus = async function poll(params) {
  try {
    const { MerchantRequestID, CheckoutRequestID } = params;
  } catch (error) {
    console.error("Error polling transaction status:", error);
  }
};
