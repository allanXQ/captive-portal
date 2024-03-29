require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const clients = require("./src/models/clients");
const { deauthenticateUser } = require("./src/controllers/router");
const { DBConn } = require("./src/config");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    //all
    origin: "*",
  })
);
app.use("/api", require("./src/routes/index"));

const port = process.env.PORT || 5000;

DBConn(app, port);

async function checkStatus() {
  try {
    const users = await clients.find({}).lean();
    users.forEach(async (client) => {
      if (
        client.status == "active" &&
        new Date(client.expiryDate) < new Date()
      ) {
        await users.findOneAndUpdate(
          { macAddress: client.macAddress },
          { status: "inactive" }
        );

        await deauthenticateUser(client.macAddress);
      }
    });
  } catch (error) {
    console.log(console.error());
  }
}

setInterval(checkStatus, 1000 * 60);
