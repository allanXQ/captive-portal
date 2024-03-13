require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { allowedOrigins } = require("./src/config");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin || allowedOrigins.indexOf(origin) !== -1) {
//         callback(null, origin);
//       } else {
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     credentials: true,
//   })
// );

app.use("/api", require("./src/routes/index"));

const port = process.env.PORT || 5000;

const pingInterval = 840000; // 14 minutes in milliseconds

function pingSelf() {
  const currentDateTime = new Date();
  const currentHourEAT = currentDateTime.getUTCHours() + 3; // Convert UTC to EAT (UTC+3)

  if (currentHourEAT >= 6 && currentHourEAT < 24) {
    axios
      .get("https://booking-server-76dj.onrender.com")
      .then((response) => {
        console.log("Service pinged successfully:", response.status);
      })
      .catch((error) => {
        console.error("Error pinging service:", error);
      });
  } else {
    console.log(
      "Ping skipped, not within the scheduled time frame",
      currentHourEAT
    );
  }
}

// Set up the interval to ping your service every 14 minutes
setInterval(pingSelf, pingInterval);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
