const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    macAddress: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: false,
    },
    completedTrial: {
      type: Boolean,
      default: false,
    },
    completedReferral: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("clients", clientSchema);
