const config = require('config');
const jwt = require('jsonwebtoken');

function validate(req, res, next) {
    const token = req.header('x-auth-token');
    const key = req.params.key;
    if (!token && !key) return res.status(401).send('Access denied. No token provided.');

    try {
        if (key) {
            if (req.route.path == '/token/:key' && key == config.get('API.getTokenKey')) {
                next();
            } else {
                res.status(400).send('Invalid key.');
            }

        }
        if (token) {
            const decoded = jwt.verify(token, config.get('API.jwtPrivateKey'));

            req.user = decoded;
            next();
        }
    } catch (ex) {
        console.log(ex);
        res.status(400).send('Invalid token.');
    }


}

function getToken() {
    const token = jwt.sign({
        app_name: config.get('Common.app_name'),
        user: 'system',
        admin: false
    }, config.get('API.jwtPrivateKey'));

    return token;
}

module.exports.validate = validate;
module.exports.getToken = getToken;