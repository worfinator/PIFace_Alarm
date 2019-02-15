const config = require('config');
const logger = require('./controllers/winston');
const alarm = require('./controllers/alarm');
const alarmAPI = require('./routes/alarm');
const express = require('express');
const app = express();

apiConfig = config.get('API');

// Need to exit if no Key available
if (!apiConfig.jwtPrivateKey) {
    console.error('FATAL ERROR: jwtPrivateKey is not defined');
    process.exit(1);
}

app.use(express.json());
app.use('/api/alarm', alarmAPI);

// Start the Server
const port = process.env.PORT || apiConfig.server.port;
app.listen(port, () => logger.l(`Listening on port ${port}...`));

// Fire Up the Alarm
alarm.init();