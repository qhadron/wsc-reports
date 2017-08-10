const express = require('express');
const router = express.Router();
const db = require('../db.js');
const oracle = require('oracledb');
const base64 = require('base64-stream');
const toString = require('stream-to-string');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const tmpFile = require('tmp-promise');
const CACHE_ROOT = path.resolve(__dirname, 'cache');
const now = require('performance-now');

const ResultSetToJsonStream = require('./lib/ResultSetToJsonStream');
const cache = require('./lib/cache');

function createUrlFromKey(base, key) {
    return `${base}/_static/${key}`;
}

function buildQuery(table, params) {
    const condition = Object
        .keys(params)
        .sort()
        .map(key => `${key} = :${key}`)
        .join(' AND ');
    let query = `SELECT * FROM HYDEX_3.${table}`;
    if (condition.length > 0) {
        query += ' WHERE ' + condition;
    }

    const args = Object
        .keys(params)
        .map(key => params[key]);
    return {query, args};
}

router.get('/_static/:key([0-9a-z\-]+)$', (req, res, next) => {
    (async() => {

        const fileid = req.params.key;
        console.log(`Requesting file ${fileid}`);

        if (!cache.has(fileid)) {
            console.log(`File not found...`);
            return next();
        }
        console.log(`Waiting for reading ${path}`);
        const stream = await cache.get(key);

        res.writeHead(200, {
            'Content-Length': fs
                .statSync(path)
                .size
        });

        console.log(`Reading ${path}`);
        const startTime = now();

        readStream
            .pipe(res)
            .on('finish', () => {
                console.log(`Read ${path} in ${now() - startTime}ms`)
            });
    })();
});

router.get('/:table/', (req, res) => {
    (async function () {
        const table = req.params.table;
        console.log(`Requested ${table}`)
        const params = req.query;
        let {query, args} = buildQuery(table, params);
        let conn;
        res.setHeader('Content-Type', 'application/json');
        try {
            console.log("Waiting for connection...");
            conn = await(await db).getConnection();
        } catch (err) {
            res.write(JSON.stringify({error: err}));
            console.error(err);
            res.send();
            return;
        }

        try {
            console.log("Connected, executing query: \n", query, args);

            const result = await conn.execute(query, args, {
                resultSet: true,
                extendedMetaData: true
            });

            new ResultSetToJsonStream(result.resultSet, cache, createUrlFromKey.bind(req.baseUrl))
                .pipe(res)
                .on('close', () => conn.close());
        } catch (err) {
            const msg = `Error in query: ${err}`;
            console.error(msg, err);
            res.write(msg);
            res.send();
            console.log("Closing connection...");
            conn.close();
        }
    })().catch(err => console.error(err));
});

router.use('/', (req, res) => {
    res.sendStatus(404);
});

module.exports = router;