require("dotenv").config();
const mongoose = require("mongoose");

const mongoClient = () => {
  return mongoose
    .connect(process.env.CLOUD_DB)
    .then(() => {
      console.log("Connected to database");
    })
    .catch((error) => {
      console.log(error);
      process.exit(0);
    });
};

module.exports = { mongoClient };
