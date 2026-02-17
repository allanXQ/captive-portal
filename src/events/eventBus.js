// eventBus.js
const { EventEmitter } = require("events");

class EventBus extends EventEmitter {}

const eventBus = new EventBus();

// Optional: increase listener cap if you have many SSE clients
eventBus.setMaxListeners(1000);

module.exports = eventBus;
