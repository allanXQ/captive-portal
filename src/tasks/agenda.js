const mongoose = require("mongoose");
const Agenda = require("agenda");
const { database_url } = require("../config/envs");
const { processDeferredSessions, deauthExpiredSessions } = require("./jobs");

let agenda;

async function initAgenda() {
  try {
    agenda = new Agenda({
      db: {
        address: database_url,
        collection: "agendaJobs",
        options: { useUnifiedTopology: true },
      },
      processEvery: "5 seconds",
    });

    agenda.define("process deferred sessions", processDeferredSessions);
    agenda.define("deauth expired sessions", deauthExpiredSessions);

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

    await agenda.every("10 seconds", "process deferred sessions");
    await agenda.every("10 seconds", "deauth expired sessions");

    console.log("🚀 Agenda started & job scheduled");
    return agenda;
  } catch (error) {
    console.error("Failed to initialize Agenda:", error);
    throw error;
  }
}

module.exports = { initAgenda, agenda };
