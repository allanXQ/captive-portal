const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  Amount: { type: Number, required: true },
  PhoneNumber: { type: String, required: true },
  MpesaRef: { type: String },
  Status: {
    type: String,
    enum: ["PENDING", "PROCESSED", "CANCELLED"],
    default: "PENDING",
  },
  ResultCode: { type: Number },
  ResultDesc: { type: String },
  TransactionDate: { type: Date },
  MerchantRequestID: { type: String, required: true },
  CheckoutRequestID: { type: String, required: true },
});

const transactions = mongoose.model("transactions", transactionSchema);
module.exports = transactions;
