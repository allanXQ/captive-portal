const DBConn = require("./dbConn");

const allowedOrigins = [
  "http://localhost:3000",
  "https://bookingclientproto.vercel.app/",
  "https://bookingclientproto.vercel.app",
];

const roles = {
  admin: "a048f5",
  user: "03e4ab",
};

const withdrawalModes = {
  Stripe: "Stripe",
  Mpesa: "Mpesa",
};

const withdrawalStatus = {
  Pending: "Pending",
  Approved: "Approved",
  Rejected: "Rejected",
};

const walletConfig = {
  minDeposit: 9,
  maxDeposit: 100000,
  minWithdrawal: 10,
  maxWithdrawal: 100000,
  withdrawalFee: 0,
  depositFee: 0,
  withdrawalFeePercentage: 0,
  depositFeePercentage: 0,
};

module.exports = {
  DBConn,
  allowedOrigins,
  roles,
  withdrawalModes,
  withdrawalStatus,
  walletConfig,
};
