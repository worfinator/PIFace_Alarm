const awsIOT = require('aws-iot-device-sdk');
const config = require('config');
const alarm = require('./alarm');
const moment = require('moment');

const commonConfig = config.get('Common');
const awsConfig = config.get('AWS');

moment.defaultFormat = config.get('Common.dateFormat');

const connection = {
    'keyPath': awsConfig.connection.keyPath,
    'certPath': awsConfig.connection.certPath,
    'caPath': awsConfig.connection.caPath,
    'clientId': awsConfig.connection.clientId,
    'host': awsConfig.connection.host
};

const shadowUpdate = `$aws/things/${commonConfig.device}/shadow/update`;
const shadowAccepted = `$aws/things/${commonConfig.device}/shadow/update/accepted`;

const device = awsIOT.device(connection);

device.on('connect', function () {
    console.log('awsIOT.device: connect');

    device.subscribe(awsConfig.topic);
    device.subscribe(shadowUpdate);
    device.subscribe(shadowAccepted);

    const message = _createMessage("status", "connected");

    device.publish(awsConfig.topic, JSON.stringify(message));
    device.publish(shadowUpdate, JSON.stringify({
        "state": {
            "reported": {
                "status": alarm.getStatus()
            }
        }
    }));
});

device.on('message', function (topic, payload) {
    const message = JSON.parse(payload);

    // only worry about message from other devices
    if (message.host != commonConfig.device && topic) {

        console.log('awsIOT.device:', topic, message);

        // handle command messages
        if (message.device == commonConfig.device &&
            message.type == 'command' &&
            message.command &&
            topic == awsConfig.topic) {

            alarm.processCommand(message.command);
        }
    }
});

device.notify = function (type, value) {
    const message = _createMessage(type, value);

    device.publish(awsConfig.topic, JSON.stringify(message));
}

device.updateShadow = function () {
    device.publish(shadowUpdate, JSON.stringify({
        "state": {
            "reported": {
                "status": alarm.getStatus()
            }
        }
    }));
}

function _createMessage(type, value) {
    const message = {
        "host": commonConfig.device,
        "type": type,
        "timestamp": _getDate()
    }

    if (type == 'alarm') {
        message.message = `Alarm triggered in ${value}`;
    }

    message[type] = value;

    return message;
}

function _getDate() {
    return moment().format(moment.defaultFormat);
}

exports.device = device;