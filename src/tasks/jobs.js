const sessions = require("../models/sessions");
const transactions = require("../models/transactions");
const queryStkStatus = require("../utils/daraja/queryStkStatus");
const {
  processTransactionStatus,
} = require("../utils/daraja/processTransactionStatus");
const userAuth = require("../utils/ssh/userAuth");

const processSessionTransitions = async (job) => {
  console.log("Running job: process session transitions");

  try {
    const now = new Date();

    // Group sessions by clientId to handle transitions atomically
    const clientsToProcess = await sessions.aggregate([
      {
        $match: {
          $or: [{ status: "ACTIVE", endTime: { $lte: now } }],
        },
      },
      {
        $group: {
          _id: "$clientId",
          sessions: { $push: "$$ROOT" },
        },
      },
    ]);

    for (const clientGroup of clientsToProcess) {
      const clientSessions = await sessions
        .find({ _id: { $in: clientGroup.sessions.map((s) => s._id) } })
        .populate("clientId")
        .sort({ startTime: 1 }); // Process in chronological order

      for (const session of clientSessions) {
        // Handle expired sessions
        if (session.status === "ACTIVE" && session.endTime <= now) {
          const result = await userAuth(
            session.clientId?._id || session.clientId,
            "DEAUTH",
          );
          if (result && result.status === "success") {
            session.status = "EXPIRED";
            await session.save();
            console.log(`📤 Marking session ${session._id} as expired`);
          } else {
            session.status = "DEAUTH_PENDING";
            session.retryAttempts = (session.retryAttempts || 0) + 1;
            await session.save();
            console.log(`📤 Marking session ${session._id} as deauth pending`);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error processing session transitions:", error);
  }
};

const pollPendingTransactions = async () => {
  console.log("Running job: poll pending transactions");

  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const pendingTransactions = await transactions
      .find({
        Status: "PENDING",
        isTransitioned: false,
        createdAt: { $gte: oneHourAgo },
      })
      .sort({ createdAt: 1 })
      .limit(25);

    if (pendingTransactions.length === 0) {
      console.log("No pending transactions to poll");
      return;
    }

    for (const transaction of pendingTransactions) {
      try {
        const response = await queryStkStatus(transaction.CheckoutRequestID);

        if (response.status !== "success") {
          console.warn(
            `No response for transaction ${transaction.CheckoutRequestID}`,
          );
          continue;
        }

        if (String(response.data.ResponseCode) !== "0") {
          console.warn(
            `STK query rejected for ${transaction.CheckoutRequestID}: ${response.ResponseDescription || response.ResponseCode}`,
          );
          continue;
        }

        if (response.data.ResultCode === 4999) {
          console.log(
            `Transaction still processing: ${transaction.CheckoutRequestID}`,
          );
          continue;
        }

        await processTransactionStatus({
          MerchantRequestID: transaction.MerchantRequestID,
          CheckoutRequestID: transaction.CheckoutRequestID,
          ResultCode: response.data.ResultCode,
          ResultDesc:
            response.data.ResultDesc || response.data.ResultDescription,
        });
      } catch (error) {
        console.error(
          `Failed to poll transaction ${transaction.CheckoutRequestID}:`,
          error.message || error,
        );
      }
    }
  } catch (error) {
    console.error("Error polling pending transactions:", error);
  }
};

const processAuthRetries = async (job) => {
  console.log("Running job: process auth retries");
  try {
    const failedAuths = await sessions.find({
      $or: [{ status: "AUTH_PENDING" }, { status: "DEAUTH_PENDING" }],
      retryAttempts: { $lt: 3 },
    });
    if (failedAuths.length === 0) {
      console.log("No failed auths to retry");
      return;
    }
    for (const session of failedAuths) {
      try {
        if (session.status === "AUTH_PENDING") {
          const result = await userAuth(session.clientId, "AUTH");
          if (result && result.status === "success") {
            session.status = "ACTIVE";
          }
          console.log(`✅ Retried authentication for ${session._id}`);
        } else if (session.status === "DEAUTH_PENDING") {
          const result = await userAuth(session.clientId, "DEAUTH");
          if (result && result.status === "success") {
            session.status = "EXPIRED";
          }
          console.log(`❌ Retried deauthentication for ${session._id}`);
        }
        session.retryAttempts += 1;
        await session.save();
      } catch (error) {
        console.error(
          `Failed retry for session ${session._id}:`,
          error.message || error,
        );
      }
    }
  } catch (error) {
    console.error("Error processing auth retries:", error);
  }
};

module.exports = {
  processSessionTransitions,
  pollPendingTransactions,
  processAuthRetries,
};
