const express = require('express');
const bodyParser = require('body-parser');

const MODULES = ['./echo', './database', './convert'];

const app = express();

app.disable('etag');
app.disable('x-powered-by');

const config = require('../config');
if (config.config.trustProxy) {
    app.enable('trust proxy');
}

// body parser
app.use(bodyParser.json({
    type: [
        'json', 'text/plain'
    ],
    strict: false
}));
app.use(bodyParser.urlencoded({extended: true}));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
});

MODULES.map(m => ({
    route: m.replace(/^\./, ''),
    handler: require(m)
})).forEach(({route, handler}) => {
    app.use(route, handler);
})

// requested api but nothing found
app.use('/', (req, res) => {
    res.status(404);
    res.send({error: 'The api you were looking for was not found.'});
});

module.exports = app;