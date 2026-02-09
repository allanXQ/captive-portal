const sshClient = require("../config/ssh");
const sessions = require("../models/sessions");

const processDeferredSessions = async (job) => {
  console.log("Running job: process deferred sessions");
  // TODO: ACCOUNT FOR SESSIONS THAT HAD THEIR DEFERRED TIME PASSED WHILE SSH WAS DOWN
  if (sshClient.isConnectionHealthy()) {
    try {
      const deferredSessions = await sessions
        .find({
          status: "DEFERRED",
          startTime: { $lte: new Date() },
        })
        .populate("clientId");
      if (deferredSessions) {
        for (const session of deferredSessions) {
          try {
            sshClient.authenticateUser(session.clientId.macAddress);
            session.status = "ACTIVE";
            await session.save();
            console.log(
              `Processed deferred session ${session._id} for client ${session.clientId.macAddress}`,
            );
          } catch (error) {
            console.error(
              `Failed to process deferred session ${session._id}:`,
              error,
            );
            // TODO: LOGGER
          }
        }
      }
    } catch (error) {
      console.error("Error processing deferred auths:", error);
    }
  } else {
    console.warn(
      "SSH connection not healthy, skipping deferred session processing",
    );
  }
};
// TODO: RECHECK SSH HEALTH MONITORING BY CONNECTING TO SSH SUCCESSFULY THE DISCONNECTING FROM WIFI NETWORK TO SEE IF SSH HEALTH CHECKS FAIL AND JOBS ARE SKIPPED, THEN RECONNECTING TO WIFI TO SEE IF JOBS RESUME PROCESSING DEFERRED SESSIONS
const deauthExpiredSessions = async (job) => {
  console.log("Running job: deauth expired sessions");
  if (sshClient.isConnectionHealthy()) {
    try {
      const expiredSessions = await sessions
        .find({
          status: "ACTIVE",
          endTime: { $lte: new Date() },
        })
        .populate("clientId");
      if (expiredSessions) {
        for (const session of expiredSessions) {
          try {
            sshClient.deauthenticateUser(session.clientId.macAddress);
            session.status = "EXPIRED";
            await session.save();
            console.log(
              `Deauthenticated expired session ${session._id} for client ${session.clientId.macAddress}`,
            );
          } catch (error) {
            console.error(
              `Failed to deauthenticate expired session ${session._id}:`,
              error,
            );
          }
        }
      }
    } catch (error) {
      console.error("Error deauthenticating expired sessions:", error);
    }
  } else {
    console.warn(
      "SSH connection not healthy, skipping expired session deauthentication",
    );
  }
};

module.exports = { processDeferredSessions, deauthExpiredSessions };
