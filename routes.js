const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const {REACT_PORT} = require('./constants');
const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer();
const morgan = require('morgan');

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

router.use(logger);
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));

router.use('/api/:file', (req, res) => {
    let filepath = `./api/${req.params.file}`;
    let handler = require(filepath);
    console.log(`Request to api ${filepath}`);
    return handler(req, res);
});

if (process.env.NODE_ENV === "development") {
    router.use('/test', express.static('static'));
}

// proxy for react
proxy.on('error', (err, req, res) => {});
router.use((req, res, next) => {
    proxy.web(req, res, {
        target: `http://localhost:${REACT_PORT}`
    }, (err) => {
        console.log("Got proxy error: ", err);
        next();
    });
});

router.use(/.*/, function (req, res) {
    res.sendStatus(500);
});

module.exports = router;