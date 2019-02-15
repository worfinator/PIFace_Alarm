const config = require('config');
const moment = require('moment');
const appRoot = require('app-root-path');
const winston = require('winston');

moment.defaultFormat = config.get('Common.dateFormat');

// define the custom settings for each transport (file, console)
var options = {
    file: {
        filename: `${appRoot}/logs/app.log`,
        handleExceptions: true,
        json: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false,
    },
    console: {
        handleExceptions: true,
        json: false,
        colorize: true,
    },
};

// instantiate a new Winston Logger with the settings defined above
var logger = winston.createLogger({
    transports: [
        new winston.transports.File(options.file),
        new winston.transports.Console(options.console)
    ],
    exitOnError: false, // do not exit on handled exceptions
});

logger.l = function (message) {
    var theDate = _getDate();
    logger.info(`${theDate} - ${message}`);
}

// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
    write: function (message, encoding) {
        // use the 'info' log level so the output will be picked up by both transports (file and console)
        logger.info(message);
    },
};

function _getDate() {
    return moment().format(moment.defaultFormat);
}

module.exports = logger;