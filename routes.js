const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
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
                skip(req, res) {
                    return req
                        .path
                        .startsWith('/browser-sync')
                }
            });
            break;

        default:
        case "production":
            return morgan('common');
    }
})();

// logger
router.use(logger);

// body parser
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));

// compress responses
router.use(compression());

// mount api
router.use('/api', api);

// mount development files
if (process.env.NODE_ENV === "development") {
    router.use('/test', express.static('static', {
        extensions: ['htm', 'html', 'txt']
    }));
}

// proxy for react
router.use((req, res) => {
    proxy.web(req, res, {
        target: `http://localhost:${UI_PORT}`
    }, (err) => {
        console.log("Got proxy error: ", err);
        res.sendStatus(502);
    });
});

// not found :/
router.use(/.*/, function (req, res) {
    res.sendStatus(404);
});

module.exports = router;