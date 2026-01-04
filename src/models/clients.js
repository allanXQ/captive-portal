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
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Clients", clientSchema);
