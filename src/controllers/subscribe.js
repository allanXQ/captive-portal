const mongoose = require("mongoose");
const triggerStkPush = require("../utils/daraja/triggerStkPush");
const { packages } = require("../config/packages");
const clients = require("../models/clients");
const sessions = require("../models/sessions");
const { normalizePhoneNumber } = require("../utils/phoneNumber");

const subscribe = async (req, res) => {
  try {
    const { clientMac, clientIp, phoneNumber, packageName } = req.body;
    if (!packageName || !clientMac || !clientIp || !phoneNumber) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const client = await clients.findOne({ macAddress: clientMac });

    const phone = normalizePhoneNumber(phoneNumber);

    const triggerPayment = async (params) => {
      const { phoneNumber, packageName, client } = params;
      try {
        //trigger payment process here
        const price = packages.find((pkg) => pkg.name === packageName)?.price;
        if (!price) {
          return res.status(400).json({ error: "Invalid package selected" });
        }
        await triggerStkPush(phoneNumber, price, client._id);
        return res.status(200).json({
          success: true,
          message: "Payment initiated, complete the payment to start session",
        });
      } catch (error) {
        throw error;
      }
    };

    if (!client) {
      const newClient = new clients({
        phoneNumber: phone,
        macAddress: clientMac,
        ipAddress: clientIp,
      });
      await newClient.save();
      await triggerPayment({
        phoneNumber: phone,
        packageName,
        client: newClient,
      });
    } else {
      if (client.ipAddress !== clientIp) {
        client.ipAddress = clientIp;
        await client.save();
      }
      await triggerPayment({ phoneNumber: phone, packageName, client });
    }
  } catch (error) {
    console.error("Subscribe error:", error);
    return res
      .status(500)
      .json({ error: "An error occurred. Please try again later." });
  }
};

module.exports = { subscribe };
