const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    ClientId: { type: mongoose.Schema.Types.ObjectId, ref: "clients" },
    Amount: { type: Number, required: true },
    PhoneNumber: { type: String, required: true },
    MpesaRef: { type: String },
    Status: {
      type: String,
      enum: ["PENDING", "PROCESSED", "FAILED"],
      default: "PENDING",
    },
    ResultCode: { type: Number },
    ResultDesc: { type: String },
    TransactionDate: { type: Date },
    MerchantRequestID: { type: String, required: true },
    CheckoutRequestID: { type: String, required: true },
    isTransitioned: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const transactions = mongoose.model("transactions", transactionSchema);
module.exports = transactions;
