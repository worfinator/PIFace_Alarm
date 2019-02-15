const config = require('config');
const jwt = require('jsonwebtoken');

function validate(req, res, next) {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).send('Access denied. No token provided.');

    try {
        const decoded = jwt.verify(token, config.get('API.jwtPrivateKey'));

        req.user = decoded;
        next();
    } catch (ex) {
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