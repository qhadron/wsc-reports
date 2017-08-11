const express = require('express');

const MODULES = ['./echo', './database'];

const router = express.Router();

MODULES.map(m => ({
    route: m.replace(/^\./, ''),
    handler: require(m)
})).forEach(({route, handler}) => {
    router.use(route, handler);
})

module.exports = router;