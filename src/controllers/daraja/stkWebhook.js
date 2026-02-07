const transactions = require("../../models/transactions");
const sessions = require("../../models/sessions");
const clients = require("../../models/clients");
const mongoose = require("mongoose");
const { packages } = require("../../config/packages");
// const config = require("../../config");
const sshClient = require("../../config/ssh");
const userAuth = require("../../utils/ssh/userAuth");
// const { authenticateUser } = require("../router");

const stkWebhook = async (req, res) => {
  try {
    //transactions
    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResponseCode,
      ResponseDescription,
    } = req.body.Body.stkCallback;
    if (
      !MerchantRequestID ||
      !CheckoutRequestID ||
      ResponseCode === undefined ||
      !ResponseDescription
    ) {
      return res.status(400).json({ message: "Invalid webhook payload" });
      // TODO: EMIT EVENT FOR INVALID PAYLOAD
    }
    let session;
    try {
      session = await mongoose.startSession();
      await session.startTransaction();

      //idempotency check
      const existingTransaction = await transactions.findOne(
        {
          MerchantRequestID,
          CheckoutRequestID,
          Status: { $ne: "PENDING" },
        },
        null,
        { session },
      );

      if (existingTransaction) {
        await session.abortTransaction();
        return res.status(200).json({ message: "Duplicate operation" });
      }

      if (parseInt(ResponseCode) !== 0) {
        await transactions.updateOne(
          {
            MerchantRequestID,
            CheckoutRequestID,
          },
          {
            $set: {
              ResponseCode,
              ResponseDescription,
              Status: "FAILED",
            },
          },
          { session },
        );
        // TODO: Emit event for failed transaction
        await session.abortTransaction();
        return res //daraja requires 200 OK for all responses
          .status(200)
          .json({ message: "Payment Failed", details: ResponseDescription });
      }

      const transaction = await transactions.findOneAndUpdate(
        {
          MerchantRequestID,
          CheckoutRequestID,
        },
        {
          $set: {
            ResponseCode,
            ResponseDescription,
            Status: "PROCESSED",
          },
        },
        { session, new: true },
      );

      if (!transaction) {
        // TODO: Emit event for missing transaction
        throw new Error("Transaction not found");
      }
      // TODO: Emit event for successful transaction
      const package = packages.find(
        (pkg) => pkg.price === parseInt(transaction.Amount),
      );
      if (!package) {
        await session.abortTransaction();
        throw new Error("No matching package for the paid amount");
      }
      const calculateSessionEndTime = (startTime) => {
        if (!package) {
          throw new Error("Invalid package name");
        }
        return startTime
          ? new Date(startTime.getTime() + package.duration * 60 * 60 * 1000)
          : new Date(Date.now() + package.duration * 60 * 60 * 1000);
      };
      //check if client has an active session
      const activeSession = await sessions.findOne(
        {
          clientId: transaction.ClientId,
          status: "ACTIVE",
        },
        null,
        { session },
      );
      if (activeSession) {
        // create new session with deferred start time
        const deferredStartTime = activeSession.endTime;
        const newSession = new sessions({
          clientId: transaction.ClientId,
          packageName: package.name,
          status: "DEFERRED",
          startTime: deferredStartTime,
          endTime: calculateSessionEndTime(deferredStartTime),
        });
        const savedSession = await newSession.save({ session });
        await session.commitTransaction();
        session = null; // Clear session reference before SSH auth
        return res.status(200).json({
          success: true,
          message:
            "New session will start after the current active session ends",
          session: savedSession,
        });
      } else {
        // create new session starting now
        const newSession = new sessions({
          clientId: transaction.ClientId,
          packageName: package.name,
          status: "ACTIVE",
          startTime: new Date(),
          endTime: calculateSessionEndTime(new Date()),
        });
        await newSession.save({ session });
        await session.commitTransaction();
        session = null; // Clear session reference before SSH auth
        await userAuth(transaction.ClientId);
        return res.status(200).json({ message: "payment success" });
      }
    } catch (error) {
      session && (await session.abortTransaction());
      throw error;
    } finally {
      session && (await session.endSession());
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({ message: "payment processing failed" });
  }
};

module.exports = { stkWebhook };
