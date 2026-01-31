const environment = process.env.NODE_ENV;

const database_url =
  environment === "development" ? process.env.DEV_DB : process.env.PROD_DB;

const server_url =
  environment === "development"
    ? process.env.DEV_SERVER_URL
    : process.env.PROD_SERVER_URL;

const router_creds = {
  host: process.env.ROUTER_IP,
  port: process.env.ROUTER_PORT,
  username: "root",
  password: process.env.ROUTER_PASSWORD,
};

module.exports = {
  database_url,
  server_url,
  router_creds,
};
