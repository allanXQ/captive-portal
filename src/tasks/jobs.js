const getSshClientshClient = require("../config/ssh");
const sessions = require("../models/sessions");
const transactions = require("../models/transactions");
const queryStkStatus = require("../utils/daraja/queryStkStatus");
const {
  processTransactionStatus,
} = require("../utils/daraja/processTransactionStatus");

const sshClient = getSshClientshClient();

const processSessionTransitions = async (job) => {
  console.log("Running job: process session transitions");

  try {
    const now = new Date();

    // Group sessions by clientId to handle transitions atomically
    const clientsToProcess = await sessions.aggregate([
      {
        $match: {
          $or: [
            { status: "ACTIVE", endTime: { $lte: now } },
            { status: "DEFERRED", startTime: { $lte: now } },
          ],
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
      const clientId = clientGroup._id;
      const clientSessions = await sessions
        .find({ _id: { $in: clientGroup.sessions.map((s) => s._id) } })
        .populate("clientId")
        .sort({ startTime: 1 }); // Process in chronological order

      let shouldAuth = false;
      let shouldDeauth = false;
      let macAddress = null;

      for (const session of clientSessions) {
        macAddress = session.clientId.macAddress;

        // Handle expired sessions
        if (session.status === "ACTIVE" && session.endTime <= now) {
          session.status = "EXPIRED";
          await session.save();
          shouldDeauth = true;
          console.log(`📤 Marking session ${session._id} as expired`);
        }

        // Handle deferred sessions
        if (session.status === "DEFERRED" && session.startTime <= now) {
          session.status = "ACTIVE";
          await session.save();
          shouldAuth = true;
          console.log(`📥 Activating deferred session ${session._id}`);
        }
      }

      // Apply final state (auth overrides deauth if both needed)
      if (shouldAuth && shouldDeauth) {
        console.log(
          `🔄 Client ${macAddress} transitioning from expired to new session`,
        );
        await sshClient.authenticateUser(macAddress);
      } else if (shouldAuth) {
        console.log(`✅ Authenticating ${macAddress}`);
        await sshClient.authenticateUser(macAddress);
      } else if (shouldDeauth) {
        console.log(`❌ Deauthenticating ${macAddress}`);
        await sshClient.deauthenticateUser(macAddress);
      }
    }
  } catch (error) {
    console.error("Error processing session transitions:", error);
  }
};

const pollPendingTransactions = async () => {
  console.log("Running job: poll pending transactions");

  try {
    const cutoffTime = new Date(Date.now() - 60 * 1000);
    const pendingTransactions = await transactions
      .find({ Status: "PENDING", createdAt: { $lte: cutoffTime } })
      .sort({ createdAt: 1 })
      .limit(25);

    if (pendingTransactions.length === 0) {
      console.log("No pending transactions to poll");
      return;
    }

    for (const transaction of pendingTransactions) {
      try {
        const response = await queryStkStatus(transaction.CheckoutRequestID);

        if (!response) {
          console.warn(
            `No response for transaction ${transaction.CheckoutRequestID}`,
          );
          continue;
        }

        if (String(response.ResponseCode) !== "0") {
          console.warn(
            `STK query rejected for ${transaction.CheckoutRequestID}: ${response.ResponseDescription || response.ResponseCode}`,
          );
          continue;
        }

        if (response.ResultCode === undefined || response.ResultCode === null) {
          console.log(
            `Transaction still pending: ${transaction.CheckoutRequestID}`,
          );
          continue;
        }

        await processTransactionStatus({
          MerchantRequestID: transaction.MerchantRequestID,
          CheckoutRequestID: transaction.CheckoutRequestID,
          ResultCode: response.ResultCode,
          ResultDesc: response.ResultDesc || response.ResultDescription,
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

module.exports = { processSessionTransitions, pollPendingTransactions };
