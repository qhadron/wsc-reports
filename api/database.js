const express = require('express');
const router = express.Router();
const db = require('../db.js');

router.get('/:table/', (req, res) => {
    (async function () {
        const table = req.params.table;
        console.log(`Requested ${table}`)
        const params = req.query;
        let query = (function () {
            console.log("Params: ", params);
            const condition = Object.keys(params)
                    .map(key => `${key} = :${key}` )
                    .join(' AND ');
            const query = 
            `SELECT * FROM HYDEX_3.${table} 
                ${condition.length ? 'WHERE' : ''} ${condition}`;
            return query;
        })();
        const args = Object.keys(params).map(key => params[key]);
        console.log("Waiting for connection...");
        const conn = await (await db).getConnection();
        
        try {
            console.log("Connected, executing query: \n", query, args);
            
            const queryReturn = await conn.execute(query, args);
            console.log("Got back ", queryReturn);
            res.writeHead(200, {"Content-Type": "application/json"});
            res.write(JSON.stringify(queryReturn));
        } catch(err) {
            const msg = `Error in query: ${err}`;
            console.error(msg, err);
            res.writeHead(500, {"Content-Type": "text/html"});
            res.write(msg);
         } finally {
            console.log("Closing connection...");
            conn.close();
         }
        res.send();
   })().catch(err => console.error(err));
});

router.use('/', (req, res) => {
    res.sendStatus(404);
});

module.exports = router;
