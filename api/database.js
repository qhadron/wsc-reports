const express = require('express');
const router = express.Router();

router.get('/:database/', (req, res) => {
    const database = req.params.database;
    console.log(`Requested ${database}`)
});

router.use('/', (req, res) => {
    res.sendStatus(404);
});

module.exports = router;