const router = require("express").Router();

const { generateSTKPush } = require("../controllers/pay/generateSTKPush");
const { darajaWebhook } = require("../controllers/pay/darajaWebhook");
const { dummyPay } = require("../controllers/pay/dummyPay");

router.post("/pay", generateSTKPush);
router.post("/dummy-pay", dummyPay); // For testing purposes
router.post("deauth", (req, res) => {
  res.status(200).json({ message: "Deauth endpoint" });
});
router.post("/daraja/webhook", darajaWebhook);

module.exports = router;
