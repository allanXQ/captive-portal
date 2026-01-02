require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sshClient = require("./src/config/ssh");
const { mongoClient } = require("./src/config/db");

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

async function startServer() {
  await mongoClient();
  await sshClient.connect();

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer().catch(error => {
  console.error('Fatal startup error:', error);
  process.exit(1);
});
