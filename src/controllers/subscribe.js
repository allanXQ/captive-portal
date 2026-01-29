const mongoose = require("mongoose");
const triggerStkPush = require("../utils/daraja/triggerStkPush");
const { packages } = require("../config");
const clients = require("../models/clients");
const sessions = require("../models/sessions");

const subscribe = async (req, res) => {
  try {
    const { clientMac, clientIp, phoneNumber, packageName } = req.body;
    const client = await clients.findOne({ macAddress: clientMac });

    const calculateSessionEndTime = (startTime, pack) => {
      const package = packages.find((pkg) => pkg.name === pack);
      if (!package) {
        throw new Error("Invalid package name");
      }
      return startTime
        ? new Date(startTime.getTime() + package.duration * 60 * 60 * 1000)
        : new Date(Date.now() + package.duration * 60 * 60 * 1000);
    };

    if (!client) {
      // TODO: This opens a loophole where client can get multiple trials by changing MAC address
      // Start a session for the transaction
      const session = await mongoose.startSession();

      try {
        // Start transaction
        await session.startTransaction();
        const pack = "trial";
        // Create new client
        const newClient = new clients({
          phoneNumber,
          macAddress: clientMac,
          ipAddress: clientIp,
        });

        const savedClient = await newClient.save({ session });

        // Create new session for the client
        const newSession = new sessions({
          clientId: savedClient._id,
          packageName: pack,
          startTime: new Date(),
          endTime: calculateSessionEndTime(new Date(), pack),
        });

        const savedSession = await newSession.save({ session });

        // Commit the transaction
        await session.commitTransaction();

        return res.status(201).json({
          success: true,
          message: "Yor free trial session has started",
          client: savedClient,
          session: savedSession,
        });
      } catch (transactionError) {
        // Rollback transaction on error
        await session.abortTransaction();
        throw transactionError;
      } finally {
        // End the session
        await session.endSession();
      }
    } else {
      if (!phoneNumber) {
        return res
          .status(400)
          .json({ error: "Phone number is required for existing clients" });
      }
      try {
        //trigger payment process here
        const price = packages.find((pkg) => pkg.name === packageName)?.price;
        if (!price) {
          return res.status(400).json({ error: "Invalid package selected" });
        }
        await triggerStkPush(phoneNumber, price);
        return res.status(200).json({
          success: true,
          message: "Payment initiated, complete the payment to start session",
        });
        // TODO: migrate to daraja webhooks to confirm payment before starting session
        // //check if client has an active session
        // const activeSession = await sessions.findOne({
        //   clientId: client._id,
        //   status: "active",
        // });
        // if (activeSession) {
        //   // create new session with deferred start time
        //   const deferredStartTime = activeSession.endTime;
        //   const newSession = new sessions({
        //     clientId: client._id,
        //     packageName,
        //     status: "active",
        //     startTime: deferredStartTime,
        //     endTime: calculateSessionEndTime(deferredStartTime),
        //   });
        //   const savedSession = await newSession.save();
        //   return res.status(201).json({
        //     success: true,
        //     message:
        //       "New session will start after the current active session ends",
        //     session: savedSession,
        //   });
        // } else {
        //   // create new session starting now
        //   const newSession = new sessions({
        //     clientId: client._id,
        //     packageName,
        //     status: "active",
        //     startTime: new Date(),
        //     endTime: calculateSessionEndTime(new Date()),
        //   });
        //   const savedSession = await newSession.save();
        //   return res.status(201).json({
        //     success: true,
        //     message: "New session has started",
        //     session: savedSession,
        //   });
        // }
      } catch (error) {
        throw error;
      }
    }
  } catch (error) {
    console.error("Subscribe error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { subscribe };
