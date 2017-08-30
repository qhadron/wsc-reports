const express = require('express');
const router = express.Router();

const query = require('./query');
const admin = require('./admin');

router.use('/admin', admin);
router.use('/', query);

module.exports = router;