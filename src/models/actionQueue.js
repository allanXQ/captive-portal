const mongoose = require("mongoose");
//TODO: RETHINK THIS
const actionQueueSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clients",
      required: true,
    },
    action: {
      type: String,
      enum: ["AUTH", "DEAUTH"],
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED"],
      default: "PENDING",
    },
    triggerAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const ActionQueue = mongoose.model("ActionQueue", actionQueueSchema);
module.exports = ActionQueue;
