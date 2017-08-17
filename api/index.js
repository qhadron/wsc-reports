const express = require('express');
const fs = require('fs');
const path = require('path');

const MODULES = ['./echo', './database', './convert'];

const router = express.Router();

router.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
});

MODULES.map(m => ({
    route: m.replace(/^\./, ''),
    handler: require(m)
})).forEach(({
    route,
    handler
}) => {
    router.use(route, handler);
})

// requested api but nothing found
router.use('/', (req, res) => {
    res.status(404);
    res.send({
        error: 'The api you were looking for was not found.'
    });
});

module.exports = router;