const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
    },
    macAddress: {
      type: String,
      required: true,
    },
    currentSubscription: {
      type: String,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Clients", clientSchema);
