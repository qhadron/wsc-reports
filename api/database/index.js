const express = require('express');
const admin = require('./admin');
const router = express.Router();

router.use('*', (req, res, next) => {
    console.log('Got Request ', req.originalUrl);
    next();
});
router.use('/admin', admin);

module.exports = router;