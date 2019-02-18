const config = require('config');
const pushover = require('pushover-notifications');

const commonConfig = config.get('Common');
const pushoverConfig = config.get('Pushover');

const p = new pushover({
    user: pushoverConfig.userKey,
    token: pushoverConfig.apiKey
});

function notify(message) {
    var msg = {
        // These values correspond to the parameters detailed on https://pushover.net/api
        // 'message' is required. All other values are optional.
        message: message, // required
        title: `${commonConfig.app_name} notification`,
        sound: pushoverConfig.sound,
        device: pushoverConfig.device,
        priority: pushoverConfig.priority
    };

    p.send(msg, function (err, result) {
        if (err) {
            // supress
        }
    });
}

exports.notify = notify;