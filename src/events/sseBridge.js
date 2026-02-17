// sse.js
const eventBus = require("./eventBus");

const clients = new Set();

function registerSSE(app) {
  app.get("/events/:clientMac", (req, res) => {
    const clientMac = req.params.clientMac;
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    res.write("\n");

    const client = { res, clientMac };
    clients.add(client);

    req.on("close", () => {
      clients.delete(client);
    });
  });
}

// Generic fan-out helper
function broadcast(eventName, payload) {
  const data = JSON.stringify(payload);

  for (const client of clients) {
    if (client.clientMac === payload.clientMac) {
      client.res.write(`event: ${eventName}\n`);
      client.res.write(`data: ${data}\n\n`);
    }
  }
}
// Subscribe ONCE to the bus
function bindEventBus() {
  eventBus.on("transactionSuccess", (payload) => {
    broadcast("transactionSuccess", payload);
  });

  eventBus.on("transactionFailed", (payload) => {
    broadcast("transactionFailed", payload);
  });

  // add more event mappings here
}

module.exports = {
  registerSSE,
  bindEventBus,
};
