const mongoose = require("mongoose");

const sessionsSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clients",
      required: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "PAUSED", "EXPIRED", "DEFERRED"],
      default: "ACTIVE",
    },
    packageName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Sessions", sessionsSchema);
