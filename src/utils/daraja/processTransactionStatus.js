const mongoose = require("mongoose");
const transactions = require("../../models/transactions");
const sessions = require("../../models/sessions");
const { packages } = require("../../config/packages");
const userAuth = require("../ssh/userAuth");
const eventBus = require("../../events/eventBus");

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
      const transaction = await transactions
        .findOneAndUpdate(
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
        )
        .populate("ClientId");

      if (!transaction) {
        await session.abortTransaction();
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
          clientId: transaction.ClientId._id,
          status: "ACTIVE",
        },
        null,
        { session },
      );

      if (activeSession) {
        await session.commitTransaction();
        session = null;
        return {
          status: "active",
          session: activeSession,
          message: "Active session already exists",
        };
      } else {
        const authResult = await userAuth(transaction.ClientId._id, "AUTH");
        const startTime = new Date();
        const endTime = calculateSessionEndTime(startTime);
        if (authResult.status !== "success") {
          const newSession = new sessions({
            clientId: transaction.ClientId._id,
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
            clientId: transaction.ClientId._id,
            packageName: package.name,
            status: "ACTIVE",
            startTime,
            endTime,
          });
          await newSession.save({ session });
          await session.commitTransaction();
          session = null;
          eventBus.emit("transactionSuccess", {
            clientMac: transaction.ClientId.macAddress,
          });
        }
      }
      return { status: "processed" };
    } else if (parseInt(ResultCode, 10) === 4999) {
      return { status: "processing" };
    } else {
      const transaction = await transactions
        .findOneAndUpdate(
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
        )
        .populate("ClientId");
      await session.commitTransaction();
      session = null;
      eventBus.emit("transactionFailed", {
        clientMac: transaction.ClientId.macAddress,
      });
      return { status: "failed", details: ResultDesc };
    }
  } catch (error) {
    eventBus.emit("serverError");
    session && (await session.abortTransaction());
    throw error;
  } finally {
    session && (await session.endSession());
  }
}

module.exports = { processTransactionStatus };
