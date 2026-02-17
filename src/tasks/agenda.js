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
        console.log("✅ Agenda is connected and ready");
        resolve();
      });
      agenda.on("error", (err) => {
        console.error("❌ Agenda connection error:", err);
        reject(err);
      });
    });

    await agenda.start();

    await agenda.every("10 seconds", "process session transitions");
    await agenda.every("10 seconds", "process auth retries");
    await agenda.every("5 seconds", "poll pending transactions");

    console.log("🚀 Agenda started & job scheduled");
    return agenda;
  } catch (error) {
    console.error("Failed to initialize Agenda:", error);
    throw error;
  }
}

module.exports = { initAgenda, agenda };
