require("dotenv").config();
const mongoose = require("mongoose");

const DBconn = async (app, port) => {
  return mongoose
    .connect(process.env.DATABASE)
    .then(() => {
      console.log("Connected to database");
      app.listen(port, () => {
        console.log(`Server running on port ${port}`);
      });
    })
    .catch((error) => {
      console.log(error);
    });
};

module.exports = DBconn;
