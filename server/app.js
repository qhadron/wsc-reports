const express = require('express');
const router = require('./routes');

const app = express();

app.disable('x-powered-by');

app.use(router);

module.exports = app;