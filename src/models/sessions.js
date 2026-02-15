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
    },
    endTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "PAUSED", "EXPIRED", "AUTH_PENDING", "DEAUTH_PENDING"],
      default: "ACTIVE",
    },
    retryAttempts: {
      type: Number,
      default: 0,
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
