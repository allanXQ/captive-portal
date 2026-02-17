const eventBus = require("../../events/eventBus");
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
      eventBus.emit("stkWebhookFailed", {
        reason: "Missing required fields",
        payload: req.body,
      });
      return res.status(200).json({});
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

    if (result.status === "active") {
      eventBus.emit("stkWebhookSuccess");
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    }
    return res.status(200).json({ message: "payment success" });
  } catch (error) {
    eventBus.emit("stkWebhookFailed", {
      reason: "Unexpected error",
      error: error.message,
    });
    console.error("Webhook processing error:", error);
    return res.status(500).json({ message: "payment processing failed" });
  }
};

module.exports = { stkWebhook };
