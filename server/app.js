const express = require('express');
const router = require('./routes');
const {trustProxy} = require('./config').config;

const app = express();

app.disable('x-powered-by');

if (trustProxy) {
    console.log('Enabling trusted proxy');
    app.enable('trust proxy');
}

app.use(router);

module.exports = app;