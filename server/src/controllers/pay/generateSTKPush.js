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
