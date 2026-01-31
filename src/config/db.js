require("dotenv").config();
const mongoose = require("mongoose");
const { database_url } = require("./envs");

const mongoClient = () => {
  return mongoose
    .connect(database_url)
    .then(() => {
      console.log("Connected to database");
    })
    .catch((error) => {
      console.log(error);
      process.exit(0);
    });
};

module.exports = { mongoClient };
