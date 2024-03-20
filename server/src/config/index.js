const DBConn = require("./dbConn");

const packages = {
  "1hr": {
    price: 10,
    duration: 1,
  },
  "6hr": {
    price: 50,
    duration: 6,
  },
  "12hr": {
    price: 100,
    duration: 12,
  },
};

module.exports = {
  DBConn,
  packages,
};
