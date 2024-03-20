const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    macAddress: {
      type: String,
      required: true,
    },
    currentSubscription: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "inactive"],
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
