const mongoose = require("mongoose");
const transactions = require("../../models/transactions");
const sessions = require("../../models/sessions");
const { packages } = require("../../config/packages");
const userAuth = require("../ssh/userAuth");

async function processTransactionStatus({
  MerchantRequestID,
  CheckoutRequestID,
  ResultCode,
  ResultDesc,
}) {
  console.log("Processing transaction status:", {
    MerchantRequestID,
    CheckoutRequestID,
    ResultCode,
    ResultDesc,
  });
  let session;

  try {
    session = await mongoose.startSession();
    await session.startTransaction();

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
      return { status: "duplicate" };
    }

    if (parseInt(ResultCode, 10) === 0) {
      const transaction = await transactions.findOneAndUpdate(
        {
          MerchantRequestID,
          CheckoutRequestID,
        },
        {
          $set: {
            ResultCode,
            ResultDesc,
            Status: "PROCESSED",
            isTransitioned: true,
          },
        },
        { session, new: true },
      );

      if (!transaction) {
        return {
          status: "failed",
          message: "Transaction not found for processing",
        };
      }

      const package = packages.find(
        (pkg) => pkg.price === parseInt(transaction.Amount, 10),
      );
      if (!package) {
        return {
          status: "failed",
          message: "No matching package for the paid amount",
        };
      }

      const calculateSessionEndTime = (startTime) => {
        return startTime
          ? new Date(startTime.getTime() + package.duration * 60 * 60 * 1000)
          : new Date(Date.now() + package.duration * 60 * 60 * 1000);
      };

      const activeSession = await sessions.findOne(
        {
          clientId: transaction.ClientId,
          status: "ACTIVE",
        },
        null,
        { session },
      );

      if (activeSession) {
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
        session = null;
        return {
          status: "deferred",
          session: savedSession,
          message:
            "New session will start after the current active session ends",
        };
      } else {
        const authResult = await userAuth(transaction.ClientId, "AUTH");
        const startTime = new Date();
        const endTime = calculateSessionEndTime(startTime);
        if (authResult.status !== "success") {
          const newSession = new sessions({
            clientId: transaction.ClientId,
            packageName: package.name,
            status: "AUTH_PENDING",
            retryAttempts: 1,
            startTime,
            endTime,
          });
          await newSession.save({ session });
          await session.commitTransaction();
          session = null;
        } else {
          const newSession = new sessions({
            clientId: transaction.ClientId,
            packageName: package.name,
            status: "ACTIVE",
            startTime,
            endTime,
          });
          await newSession.save({ session });
          await session.commitTransaction();
          session = null;
        }
      }
      return { status: "processed" };
    } else if (parseInt(ResultCode, 10) === 4999) {
      return { status: "processing" };
    } else {
      await transactions.updateOne(
        {
          MerchantRequestID,
          CheckoutRequestID,
        },
        {
          $set: {
            ResultCode,
            ResultDesc,
            Status: "FAILED",
            isTransitioned: true,
          },
        },
        { session },
      );
      await session.commitTransaction();
      return { status: "failed", details: ResultDesc };
    }
  } catch (error) {
    session && (await session.abortTransaction());
    throw error;
  } finally {
    session && (await session.endSession());
  }
}

module.exports = { processTransactionStatus };
