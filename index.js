const config = require("config");
const logger = require("./controllers/winston");
const alarm = require("./controllers/alarm");
const alarmAPI = require("./routes/alarm");
const express = require("express");
const app = express();

apiConfig = config.get("API");

// Errors to log file, this need to run
// as a service and not stop
process.on("uncaughtException", ex => {
  console.log("Error exception");
  logger.error(ex.message, ex);
});

// Get logger to handle
process.on("unhandledRejection", ex => {
  throw ex;
});

// Need to exit if no Key available
if (!apiConfig.jwtPrivateKey) {
  console.error("FATAL ERROR: jwtPrivateKey is not defined");
  process.exit(1);
}

// We use express for a simple API that
// allows local control of the alarm for testing
// AWSIoT MQTT will be what controls it in
// the real world
app.use(express.json());
app.use("/api/alarm", alarmAPI);

// Start the Server
const port = process.env.PORT || apiConfig.server.port;
app.listen(port, () => logger.l(`Listening on port ${port}...`));

// Fire Up the Alarm
alarm.init();
