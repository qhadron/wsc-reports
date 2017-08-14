const express = require('express');

const MODULES = ['./echo', './database'];

const router = express.Router();

router.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
});

MODULES.map(m => ({
    route: m.replace(/^\./, ''),
    handler: require(m)
})).forEach(({route, handler}) => {
    router.use(route, handler);
})

module.exports = router;