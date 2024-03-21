const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  mpesaReceiptNumber: {
    type: String,
    required: true,
  },
  transactionDate: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Payments", paymentSchema);
