const {
  processTransactionStatus,
} = require("../../utils/daraja/processTransactionStatus");

const stkWebhook = async (req, res) => {
  try {
    console.log("Received STK webhook:", JSON.stringify(req.body));
    //transactions
    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } =
      req.body.Body.stkCallback;
    if (
      !MerchantRequestID ||
      !CheckoutRequestID ||
      ResultCode === undefined ||
      !ResultDesc
    ) {
      return res.status(400).json({ message: "Invalid webhook payload" });
      // TODO: EMIT EVENT FOR FAILED WEBHOOK
    }
    const result = await processTransactionStatus({
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
    });
    // TODO: STATUS TO BE USED JUST FOR LOGGING
    if (result.status === "duplicate") {
      return res.status(200).json({ message: "Duplicate operation" });
    }

    if (result.status === "failed") {
      return res
        .status(200)
        .json({ message: "Payment Failed", details: ResultDesc });
    }

    if (result.status === "deferred") {
      return res.status(200).json({
        success: true,
        message: result.message,
        session: result.session,
      });
    }
    // TODO: EMIT EVENT FOR TRANSACTION PROCESSED

    return res.status(200).json({ message: "payment success" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({ message: "payment processing failed" });
  }
};

module.exports = { stkWebhook };
