const router = require("express").Router();

const { generateSTKPush } = require("../controllers/pay/generateSTKPush");
const { darajaWebhook } = require("../controllers/pay/darajaWebhook");
const { dummySubscribe } = require("../controllers/pay/dummySubscribe");
const sshClient = require("../config/ssh");

router.post("/subscribe", generateSTKPush);
router.post("/dummy-subscribe", dummySubscribe); // For testing purposes
router.post("/deauth", (req, res) => {
   const { macAddress } = req.body;
   sshClient.deauthenticateUser(macAddress);
  return res.status(200).json({ message: "Deauth endpoint" });
});
router.get("/packages", (req, res) => {
  const config = require("../config");
  return res.status(200).json({ packages: config.packages });
});
router.post("/daraja/webhook", darajaWebhook);

module.exports = router;
