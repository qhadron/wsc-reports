const express = require('express');
const router = express.Router();
const db = require('../../../db');
const now = require('performance-now');
const fileType = require('file-type');
const {PassThrough} = require('stream');

const ResultSetToJsonStream = require('../lib/ResultSetToJsonStream');
const cache = require('../lib/cache');

function createUrlFromKey(base, key) {
    return `${base}/_static/${key}`;
}

router.get('/_static/:key([0-9a-z\-]+)$', (req, res, next) => {
    (async() => {

        const key = req.params.key;
        console.log(`Requesting file ${key}`);

        if (!cache.has(key)) {
            console.log(`File not found...`);
            return next();
        }
        console.log(`Waiting for reading ${key}`);
        const stream = await cache.get(key);

        if (!stream) {
            throw Error(`Key not found`);
        }

        res.status(200);

        console.log(`Reading ${key}`);
        const startTime = now();
        // listen for first chunk of file data to get filetype
        const dupe = stream.pipe(new PassThrough());

        function ondata(chunk) {
            const result = fileType(chunk);
            if (!result) 
                return;
            console.log(`Type of ${key} is ${result.mime}`);
            res.setHeader('Content-Type', result.mime);
            res.setHeader('Content-Disposition', `inline; filename=${key}.${result.ext}`);
        };
        dupe.once('data', ondata);
        stream
            .pipe(res)
            .on('finish', () => {
                console.log(`Read ${key} in ${now() - startTime}ms`)
            });
    })().catch(err => handleError(req, res, err));
});

router.get('/:table/', (req, res) => {
    (async function () {
        const table = req.params.table;
        console.log(`Requested ${table}`)
        const params = req.query;
        let {query, args} = buildQuery(table, params);

        return handleQuery(query, args, req, res).catch(err => handleError(req, res, err));

    })();
});

router.get('/', (req, res) => {
    Promise
        .resolve()
        .then(() => {
            console.log(`Executing statement`);
            const query = req.query.q;

            return handleQuery(query, [], req, res).catch(err => handleError(req, res, err));
        });
});

async function handleQuery(query, args, req, res) {
    if (!query) {
        throw new Error('Query is not defined');
    }
    let conn;
    res.setHeader('Content-Type', 'application/json');

    console.log("Waiting for connection...");
    const pool = await db;
    conn = await pool.getConnection();

    let result;
    console.log("Connected, executing query: \n", query, args);
    const queryStart = now();
    try {
        result = await conn
            .execute(query, args, {
            resultSet: true,
            extendedMetaData: true
        })
            .catch(err => {
                throw err
            });
    } catch (err) {
        conn.close();
        err.message = `Error in query: ${err}`;
        throw err;
    }

    const outStream = new ResultSetToJsonStream(result.resultSet, cache, createUrlFromKey.bind(null, req.baseUrl), () => {
        console.log(`Finished reading all query data in ${now() - queryStart}ms`);
        conn.close();
    });
    outStream.on('error', err => {
        console.error(err);
        err = Object.assign(err, {message: `Error writing stream :${err}`});
        // try to fix json format
        res.write(`], "error":`);
        res.write(JSON.stringify(err.message));
        res.write(`, "error_raw":`);
        res.write(JSON.stringify(Object.assign({}, err)));
        res.write(`}`);

        res.status(500);
        res.send();
    });
    outStream.pipe(res);
    res.on('finish', () => {
        console.log(`Finished executing and parsing query in ${now() - queryStart}ms`);
    });
}

function handleError(req, res, err) {
    console.error(err);
    res.status(err.status || 500);
    res.write(JSON.stringify({error: err.message}));
    res.send();
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

module.exports = router;