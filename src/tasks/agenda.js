const mongoose = require("mongoose");
const Agenda = require("agenda");
const { database_url } = require("../config/envs");
const {
  processSessionTransitions,
  processAuthRetries,
  pollPendingTransactions,
} = require("./jobs");

let agenda;

async function initAgenda() {
  try {
    agenda = new Agenda({
      db: {
        address: database_url,
        collection: "agendaJobs",
        options: { useUnifiedTopology: true },
      },
      maxConcurrency: 20,
    });

    agenda.define("process session transitions", processSessionTransitions);
    agenda.define("process auth retries", processAuthRetries);
    agenda.define("poll pending transactions", pollPendingTransactions);

    await new Promise((resolve, reject) => {
      agenda.on("ready", () => {
        console.info(
          { category: "tasks", subcategory: "agenda" },
          "Agenda is connected and ready",
        );
        resolve();
      });
      agenda.on("error", (err) => {
        console.error(
          { category: "tasks", subcategory: "agenda", err },
          "Agenda connection error",
        );
        reject(err);
      });
    });
    // ensure any previously persisted scheduled jobs are cleared to avoid
    // stale/disabled instances preventing execution
    try {
      await agenda.cancel({ name: "poll pending transactions" });
      await agenda.cancel({ name: "process session transitions" });
      await agenda.cancel({ name: "process auth retries" });
      console.info(
        { category: "tasks", subcategory: "agenda" },
        "Cleared existing scheduled jobs",
      );
    } catch (err) {
      console.warn(
        "Failed to cancel existing poll jobs (non-fatal):",
        err.message || err,
      );
    }

    await agenda.start();

    await agenda.every("10 seconds", "process session transitions");
    console.log("Scheduled: process session transitions (every 10s)");
    await agenda.every("10 seconds", "process auth retries");
    console.log("Scheduled: process auth retries (every 10s)");

    // Only schedule the polling job when MongoDB connection is ready.
    // if (mongoose.connection && mongoose.connection.readyState === 1) {
    await agenda.every("5 seconds", "poll pending transactions");
    console.log("Scheduled: poll pending transactions (every 5s)");
    // } else {
    //   console.warn(
    //     "MongoDB not ready; deferring scheduling of poll pending transactions",
    //   );
    //   const retryInterval = setInterval(async () => {
    //     if (mongoose.connection && mongoose.connection.readyState === 1) {
    //       try {
    //         await agenda.every("5 seconds", "poll pending transactions");
    //         console.log("Scheduled: poll pending transactions (deferred)");
    //       } catch (err) {
    //         console.error(
    //           "Failed to schedule deferred poll job:",
    //           err.message || err,
    //         );
    //       }
    //       clearInterval(retryInterval);
    //     }
    //   }, 5000);
    // }

    console.info(
      { category: "tasks", subcategory: "agenda" },
      "Agenda started & job scheduled",
    );
    return agenda;
  } catch (error) {
    console.error(
      { category: "tasks", subcategory: "agenda", err: error },
      "Failed to initialize Agenda",
    );
    throw error;
  }
}

module.exports = { initAgenda, agenda };
