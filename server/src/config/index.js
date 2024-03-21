const DBConn = require("./dbConn");

const packages = {
  "1hr": {
    price: 10,
    duration: 1,
    expiry: 60 * 60 * 1000,
  },
  "6hr": {
    price: 50,
    duration: 6,
    expiry: 6 * 60 * 60 * 1000,
  },
  "12hr": {
    price: 100,
    duration: 12,
    expiry: 12 * 60 * 60 * 1000,
  },
};

module.exports = {
  DBConn,
  packages,
};
