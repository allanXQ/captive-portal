require("dotenv").config();
const mongoose = require("mongoose");

const MongoClient = () => {
  return mongoose
    .connect(process.env.DATABASE)
    .then(() => {
      console.log("Connected to database");
    })
    .catch((error) => {
      console.log(error);
    });
};

module.exports = {MongoClient};
