require("dotenv").config();
const { NodeSSH } = require("node-ssh");
const ssh = new NodeSSH();

async function authenticateUser(macAddress) {
  await ssh.connect({
    host: process.env.ROUTER_IP,
    port: process.env.ROUTER_PORT,
    username: "root",
    password: process.env.ROUTER_PASSWORD,
  });

  macAddress = macAddress.toLowerCase();

  await ssh.execCommand(`/etc/nodogsplash/scripts/auth.sh ${macAddress}`);
  ssh.dispose();
}

async function deauthenticateUser(macAddress) {
  await ssh.connect({
    host: process.env.ROUTER_IP,
    username: "root",
    password: process.env.ROUTER_PASSWORD,
  });
  macAddress = macAddress.toLowerCase();

  const response = await ssh.execCommand(
    `/etc/nodogsplash/scripts/deauth.sh ${macAddress}`
  );

  console.log(response);

  ssh.dispose();
}

async function getmacs() {
  await ssh.connect({
    host: process.env.ROUTER_IP,
    port: process.env.ROUTER_PORT,
    username: "root",
    password: process.env.ROUTER_PASSWORD,
  });

  const res = await ssh.execCommand(`/etc/nodogsplash/scripts/getmacs.sh`);

  const response = res.stdout;
  const regex =
    /([0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2})/g;

  // Find and print all MAC addresses
  const macAddresses = response.match(regex);
  console.log({
    host: process.env.ROUTER_IP,
    port: process.env.ROUTER_PORT,
    username: "root",
    password: process.env.ROUTER_PASSWORD,
  });
  console.log("response", res);

  console.log(macAddresses);

  ssh.dispose();
}

module.exports = {
  authenticateUser,
  deauthenticateUser,
  getmacs,
};
