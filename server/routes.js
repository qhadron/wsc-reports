const express = require('express');
const router = express.Router();
const {UI_PORT} = require('./constants');
const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer();
const morgan = require('morgan');
const compression = require('compression');

const api = require('./api');

const logger = (() => {
    switch (process.env.NODE_ENV) {
        case "development":
            return morgan('dev', {
                skip(req, _res) {
                    return req
                        .path
                        .startsWith('/browser-sync')
                }
            });

        default:
        case "production":
            return morgan('common');
    }
})();

// logger
router.use(logger);

// compress responses
router.use(compression());

// mount api
router.use('/api', api);

// mount admin files authentication
if (process.env.NODE_ENV !== "development") {
    const localhost = [/127.0.0.1/, /localhost/, /::1/];
    router.use('/admin', (req, res, next) => {
        if (!localhost.find((pattern) => pattern.exec(req.ip))) {
            return res.send(`
            Access page on the server at localhost/admin/ 
            `);
        }
        next();
    })
}
router.use('/admin', express.static('static/admin', {extensions: ['html']}));

router.use('/', express.static('static/public', {extensions: ['html']}));

// not found :/
router.use(function (req, res) {
    res.sendStatus(404);
});

module.exports = router;