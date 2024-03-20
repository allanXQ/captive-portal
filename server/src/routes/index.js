const router = require("express").Router();

const { generateSTKPush } = require("../controllers/pay/generateSTKPush");
const { darajaWebhook } = require("../controllers/pay/darajaWebhook");

router.post("/pay", generateSTKPush);
router.post("/daraja/webhook", darajaWebhook);

module.exports = router;
