const express = require('express'),
    router = express.Router(),
    bodyParser = require('body-parser');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));

router.use('/api/:file', (req, res) => {
    let filepath = `./api/${req.params.file}`;
    let handler = require(filepath);
    console.log(`Request to api ${filepath}`);
    return handler(req, res);
});

router.use(express.static('static'));

router.use(/.*/, function (req, res) {
    res.sendStatus(404);
});

module.exports = router;