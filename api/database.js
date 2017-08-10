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

// make directory if not already exists
if (!fs.existsSync(CACHE_ROOT)) {
    CACHE_ROOT
        .split(path.sep)
        .reduce((cwd, childname) => {
            const next = path.resolve(cwd, childname);
            if (!fs.existsSync(next)) {
                fs.mkdirSync(next);
            }
            return next;
        }, path.sep);
}

// get new cache directory
const CACHE_DIR = CACHE_ROOT;

// cache large data for 5 minutes
const cache = require('node-file-cache').create({
    life: 60 * 5,
    file: path.resolve(CACHE_DIR, 'store.json')
});

/**
 *
 * @param {String} query
 * @param {Array} row
 */
function getKey(query, row, idx) {
    // normalize input
    query = query
        .trim()
        .toLowerCase();
    const hash = crypto.createHash('md5');
    hash.update(query);
    row
        .filter(x => x !== null && x.dbType !== oracle.DB_TYPE_BLOB && x.dbType !== oracle.DB_TYPE_CLOB)
        .forEach(x => hash.update(x.toString()));
    return `${hash.digest('hex')}-${idx}`;
}

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

        const fileobj = cache.get(fileid);
        if (!fileobj) {
            console.log(`File not found...`);
            return next();
        }
        const {path, fd, wait} = fileobj;
        console.log(`Got ${path}:${fd}`);
        console.log(`Waiting for write ${path}`);
        await wait;
        console.log(`Write finished ${path}`);
        let readStream;
        try {
            if (fd) {
                readStream = fs.createReadStream(null, {fd: fd});
            }
            if (path) {
                readStream = fs.createReadStream(path);
            }
        } catch (err) {
            console.error(`Could not open stream for ${path}: `, err);
            next();
        }

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
        try {
            console.log("Waiting for connection...");
            conn = await(await db).getConnection();
        } catch (err) {
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.write(JSON.stringify({error: err}));
            console.error(err);
            res.send();
            return;
        }

        try {
            console.log("Connected, executing query: \n", query, args);

            const stream = await conn.queryStream(query, args, {
                resultSet: true,
                extendedMetaData: true
            });

            res.setHeader('Content-Type', 'application/json');

            let meta = undefined;
            let buffer = [];
            let writePromises = [];

            const readStartTime = now();

            stream.on('error', err => {
                console.error('Got error from database: ', err);
                res.write(JSON.stringify(err.message));
                res.flush();
                res.send();
                conn.close();
            });

            stream.on('metadata', function (metadata) {
                res.write('{');
                res.write(`"metaData": ${JSON.stringify(metadata)}`);
                res.write(', "rows": [[]');
                meta = metadata;
            });

            stream.on('data', function (data) {
                buffer.push(data);
                if (meta) {
                    res.write(',');
                    res.write(buffer.map(row => {
                        let key;
                        for (let i = 0; i < row.length; ++i) {
                            if (meta[i].dbType === oracle.DB_TYPE_BLOB) {
                                key = key || getKey(query, row, i);
                                if (!cache.get(key)) {
                                    console.log('Caching file for request');
                                    const {name, fd} = tmpFile.fileSync({dir: CACHE_DIR, unsafeCleanup: true});
                                    const stream = row[i];
                                    const writeFinished = new Promise((resolve, reject) => {
                                        const startTime = now();
                                        stream
                                            .pipe(fs.createWriteStream(null, {fd: fd}))
                                            .on('finish', () => {
                                                resolve();
                                                console.log(`Write to ${name} finished in ${now() - startTime}ms`);
                                            });
                                    });
                                    writePromises.push(writeFinished);
                                    cache.set(key, {
                                        path: name,
                                        fd: fd,
                                        wait: writeFinished
                                    });
                                } else {
                                    console.log('Serving file from cache...');
                                }
                                row[i] = createUrlFromKey(req.baseUrl, key);
                            }
                        }
                        return JSON.stringify(row);
                    }).join(','));
                    res.flush();
                    buffer = [];
                }
            });

            writePromises.push(new Promise((resolve, reject) => {
                stream
                    .on('end', function () {
                        console.log("Connection closed");
                        res.write(']}');
                        res.send();
                        resolve();
                    });
            }));

            Promise
                .all(writePromises)
                .then(() => console.log(`Parsed and sent in ${now() - readStartTime}ms`))
                .then(() => conn.close())
                .catch((err) => {
                    console.log(`Got error while building response`);
                    throw err;
                });

            res.on('close', () => conn.close());

        } catch (err) {
            const msg = `Error in query: ${err}`;
            console.error(msg, err);
            res.writeHead(500, {"Content-Type": "text/plain"});
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