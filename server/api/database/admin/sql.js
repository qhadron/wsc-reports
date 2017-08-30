const express = require('express');
const router = express.Router();

const {handleQuery, handleError, staticRouter} = require('../lib/doquery');

router.use(staticRouter);

router.use('/', (req, res) => {
    const query = req.query.q || req.body.q;
    return handleQuery(query, [], req, res).catch(err => handleError(req, res, err));
});

module.exports = router;