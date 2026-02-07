import { Agenda } from "agenda";
import { MongoBackend } from "@agendajs/mongo-backend";
import { mongoClient } from "../config/db";
import sessions from "../models/sessions";
import sshClient from "../config/ssh";

// Via existing MongoDB connection
const agenda = new Agenda({
  backend: new MongoBackend({
    mongo: mongoClient,
    collection: "agendaJobs",
  }),
  //   processEvery: "30 seconds", // Job polling interval
  maxConcurrency: 20, // Max concurrent jobs
  defaultConcurrency: 5, // Default per job type
});

agenda.define("process deferred sessions", async (job) => {
  console.log("Running job: process deferred sessions");
  //   try {
  //   const deferredSessions = await sessions
  //       .find({
  //         status: "DEFERRED",
  //         startTime: { $lte: new Date() },
  //       })
  //       .populate("clientId");
  //     if (deferredSessions) {
  //       for (const session of deferredSessions) {
  //         try {
  //   sshClient.authenticateUser(session.clientId.macAddress);
  //           session.status = "ACTIVE";
  //           await session.save();
  //           console.log(
  //             `Processed deferred session ${session._id} for client ${session.clientId.macAddress}`,
  //           );
  //         } catch (error) {
  //           console.error(
  //             `Failed to process deferred session ${session._id}:`,
  //             error,
  //           );
  //           // TODO: LOGGER
  //         }
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error processing deferred auths:", error);
  //   }
});

agenda.on("ready", async () => {
  await agenda.start();
  console.log("Agenda started and ready to process jobs");
});

async function gracefulShutdown() {
  console.log("Shutting down agenda...");
  await agenda.stop();
  console.log("Agenda stopped gracefully");
}

async function jobScheduler() {
  try {
    await agenda.every("10 seconds", "process deferred sessions");
    console.log(
      "Scheduled 'process deferred sessions' to run every 10 seconds",
    );
  } catch (error) {
    console.error("Error scheduling jobs:", error);
  }
}

jobScheduler();

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

module.exports = { agenda };
