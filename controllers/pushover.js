const config = require('config');
const pushover = require('pushover-notifications');

const commonConfig = config.get('Common');
const pushoverConfig = config.get('Pushover');

const p = new pushover({
    user: 'uALQ4Xr62yaY8nrNznv3pLMuUPss3t',
    token: 'ayo8srvhg125uz6jxm9rspa2hkgspf'
});

function notify(message) {
    var msg = {
        // These values correspond to the parameters detailed on https://pushover.net/api
        // 'message' is required. All other values are optional.
        message: message, // required
        title: `${commonConfig.app_name} notification`,
        sound: commonConfig.sound,
        device: commonConfig.device,
        priority: commonConfig.priority
    };

    p.send(msg, function (err, result) {
        if (err) {
            // supress
        }
    });
}

exports.notify = notify;