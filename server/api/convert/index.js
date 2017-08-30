const express = require('express');
const {
    convert
} = require('./lib/convert');

const router = express.Router();

router.use('^/$', (req, res) => {
    const str = req.query.q || req.body.q;
    res.writeHead('200', {
        'Content-Type': 'text/plain'
    });
    res.end(convert(str));
});

module.exports = router;