const express = require('express');
const ResultSetToJsonStream = require('../lib/ResultSetToJsonStream');
const db = require('../../../db');
const now = require('performance-now');

const FileTypeStream = require('../lib/FileTypeStream');
const cache = require('../lib/cache');

const staticRouter = express.Router();
const Debug = require('debug');
const debug_static = Debug('api:database:lib:query:static');
const debug_query = Debug('api:database:query:query');

staticRouter.get('/_static/:key([0-9a-z\-]+)$', (req, res, next) => {
    (async() => {

        const key = req.params.key;
        debug_static(`Requesting file ${key}`);

        if (!cache.has(key)) {
            debug_static(`File not found...`);
            return next();
        }
        debug_static(`Waiting for reading ${key}`);
        const stream = await cache.get(key);

        if (!stream) {
            throw Error(`Key not found`);
        }

        res.status(200);

        debug_static(`Reading ${key}`);
        const startTime = now();
        stream
            .pipe(new FileTypeStream())
            .on('filetype', result => {
                if (!result) 
                    return;
                debug_static(`Type of ${key} is ${result.mime}`);
                res.setHeader('Content-Type', result.mime);
                res.setHeader('Content-Disposition', `inline; filename=${key}${result && '.' + result.ext || ''}`);
            })
            .pipe(res)
            .on('finish', () => {
                debug_static(`Read ${key} in ${now() - startTime}ms`)
            });
    })().catch(err => handleError(req, res, err));
});

function createUrlFromKey(base, key) {
    return `${base}/_static/${key}`;
}
async function handleQuery(query, args, req, res) {
    if (!query) {
        throw new Error('Query is not defined');
    }
    let conn;
    res.setHeader('Content-Type', 'application/json');

    debug_query("Waiting for connection...");
    const pool = await db;
    conn = await pool.getConnection();

    let result;
    debug_query("Connected, executing query: \n", query, args);
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
        debug_query(`Finished reading all query data in ${now() - queryStart}ms`);
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
        debug_query(`Finished executing and parsing query in ${now() - queryStart}ms`);
    });
}

function handleError(req, res, err) {
    console.error(err);
    res.status(err.status || 500);
    res.write(JSON.stringify({error: err.message}));
    res.send();
}

module.exports = {
    handleError: handleError,
    handleQuery: handleQuery,
    staticRouter: staticRouter
}