const express = require('express');

const router = express.Router();

const manage = require('./manage');
const sql = require('./sql');

router.use('/manage', manage);
router.use('/sql', sql);
router.use((req, res) => {
    res.sendStatus(404);
})

module.exports = router;