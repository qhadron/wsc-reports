const express = require('express');
const router = express.Router();

router.get('/:table/', (req, res) => {
    const table = req.params.table;
    console.log(`Requested ${table}`)
    const params = req.query;
    const STRING = 
    `SELECT * FROM ${table} 
        WHERE (${(_ => {
            let res = "";
            for (const item of params) {
                res += `${item.key} = ${item.value}`;
            }
        })()})`;
    res.write(STRING);
    res.send();
});

router.use('/', (req, res) => {
    res.sendStatus(404);
});

module.exports = router;