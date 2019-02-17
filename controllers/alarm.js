const config = require('config');
const logger = require('./winston');
const awsIOT = require('./awsIOT');
const pushover = require('./pushover');
const PIFD = require('node-pifacedigital');
const pi = new PIFD.PIFaceDigital(0, true);

const alarmConfig = config.get('Alarm');

var alarm = {
    'active': false,
    'triggered': false,
    'alert': false,
    'arming': false,
    'zones': {},
    'buzzers': {},
    'sirens': {}
};

async function init() {
    await _resetOutputs(false);
    await _initaliseInputs();
    await _initaliseOutputs();
}

async function setAlarm(status) {
    if (status) {
        await _arm();
    } else {
        await _disarm();
    }

    // Human readable response
    status = alarm.active ? 'Enabled' : 'Disabled';

    return Promise.resolve(status);
}

function getStatus() {
    return alarm;
}

function processCommand(command) {
    switch (command) {

        case "arm":
            _arm();
            break;

        case "disarm":
            _disarm();
            break;
    }
}

function _initaliseInputs() {
    return new Promise((resolve, reject) => {
        // Initialise input watches
        alarmConfig.inputs.forEach(input => {
            pi.watch(input.pin, _processEvent);

            if (input.type === 'zone') {
                alarm.zones[input.name] = {
                    'active': true,
                    'motion': false,
                    'triggered': false
                };

            }
        });

        logger.l(`Alarm inputs initialised and watching for events`);
        resolve(true);
    });
}

function _initaliseOutputs() {
    return new Promise((resolve, reject) => {
        // Setup output collection 
        alarmConfig.outputs.forEach(output => {
            if (output.active) {

                alarm[output.type + 's'][output.name] = {
                    'pin': output.pin,
                    'active': true,
                    'triggered': false
                };

            }

        });

        logger.l(`Alarm outputs configured`);
        resolve(true);
    });
}

const _processEvent = function (pin, event) {
    // raise event trigger
    if (alarmConfig.inputs[pin].active) {

        if (alarmConfig.inputs[pin].type === 'zone') {
            var motion = false;
            if (event === alarmConfig.inputs[pin].event) motion = true;
            _triggerZoneEvent(alarmConfig.inputs[pin].name, motion);
        }

    }
}

function _triggerZoneEvent(zone, motion) {
    // Log zone event
    alarm.zones[zone].motion = motion;
    logger.l(`${zone} motion ${motion ? 'detected' : 'ceased'}`);
    awsIOT.device.updateShadow();

    // Only raise an alarm if one is not already rasied
    if (alarm.active &&
        alarm.zones[zone].active &&
        !alarm.triggered) {

        alarm.zones[zone].triggered = true;
        awsIOT.device.updateShadow();

        // raise alarm
        logger.l(`${zone} alarm triggered `);
        alarm.triggered = true;
        _raiseAlarm(zone);
    }
}

function _raiseAlarm(zone) {
    //activate the buzzer warning 
    _toggleOutput('buzzers', true, alarmConfig.buzzer.alarmDuration);

    // Setup siren at the end of buzzer warning
    setTimeout(async function () {
        if (alarm.active && alarm.triggered) {

            alarm.alert = true;

            awsIOT.device.notify("alarm", zone);
            awsIOT.device.updateShadow();

            pushover.notify(`Alarm triggered in ${zone}`);

            await _toggleOutput('sirens', true, alarmConfig.siren.alarmDuration);

            alarm.triggered = false;
            alarm.alert = false;

            awsIOT.device.notify("status", "alarm reset");
            awsIOT.device.updateShadow();
        }
    }, alarmConfig.buzzer.alarmDuration);
}

function _toggleOutput(type, status, duration, log = true) {
    return new Promise((resolve, reject) => {
        // On
        _setOutput(type, status, log);
        // Off after duration
        setTimeout(function () {
            _setOutput(type, status ? false : true, log);
            resolve(true);
        }, duration);
    });
}

function _setOutput(type, status, log = true) {
    // Each item in group
    for (var output in alarm[type]) {
        pi.set(alarm[type][output].pin, status);
        alarm[type][output].triggered = status;

        if (log) {
            logger.l(`${output} ${status ? 'on' : 'off'}`);
            awsIOT.device.updateShadow();
        }
    }
}

async function _pingBuzzer() {
    if (alarm.arming) {
        await _toggleOutput('buzzers', true, alarmConfig.buzzer.beepDuration, false);
        await _pauseBuzzer();
    }
    return Promise.resolve(true);
}

async function _pauseBuzzer() {
    return new Promise((resolve, reject) => {
        if (alarm.arming) {
            setTimeout(function () {
                resolve(true);
            }, alarmConfig.buzzer.beepPause);
        } else {
            resolve(true);
        }
    });
}

async function _countDownBuzzer() {
    const counter = alarmConfig.armDuration / (alarmConfig.buzzer.beepDuration = alarmConfig.buzzer.beepPause);

    for (var i = 1; i < counter; i++) {
        await _pingBuzzer();
    }

    if (alarm.arming) {
        await _toggleOutput('buzzers', true, alarmConfig.buzzer.beepFinal, false);
    }

    return Promise.resolve(true);
}

async function _arm() {
    // Only arm if not already active or arming
    if (!alarm.active && !alarm.arming) {

        // stop any current alarms
        _resetOutputs(false);

        alarm.arming = true;

        logger.l(`Arming alarm`);

        awsIOT.device.notify("status", "arming");
        awsIOT.device.updateShadow();

        await _countDownBuzzer();

        if (alarm.arming) {
            alarm.active = true;
            alarm.arming = false;

            logger.l(`Alarm armed`);

            awsIOT.device.notify("status", "armed");
            awsIOT.device.updateShadow();
        }

    }

    return Promise.resolve(true);
}

async function _disarm() {
    if (alarm.active || alarm.arming) {
        // stop any current alarms
        alarm.active = false;
        alarm.arming = false;

        _resetOutputs(false);

        logger.l(`Alarm disarmed`);

        awsIOT.device.notify("status", "disarmed");
        awsIOT.device.updateShadow();
    }

    return Promise.resolve(true);
}

function _resetOutputs(display = true) {
    return new Promise((resolve, reject) => {
        var type = '';

        for (var index in alarmConfig.outputs) {
            // reset output pin
            pi.set(alarmConfig.outputs[index].pin, 0);

            type = alarmConfig.outputs[index].type + 's';

            // reset the triggered flag if applicable
            if (alarm[type][alarmConfig.outputs[index].name]) {
                alarm[type][alarmConfig.outputs[index].name].triggered = false;
            }

            // Output if required
            if (display) {
                logger.l(`${alarmConfig.outputs[index].name} off `);
                awsIOT.device.updateShadow();
            }
        }
        resolve(true);
    });
}

exports.init = init;
exports.setAlarm = setAlarm;
exports.getStatus = getStatus;
exports.processCommand = processCommand;