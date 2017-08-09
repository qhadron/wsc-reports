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

const cache = {};

function createUniqueFilename(file) {
    const hash = crypto.createHash('md5');
    hash.update(file);
    return `${hash.digest('hex')}`;
}

function createUrlFromFilename(base, filename) {
    return `${base}/_static/${filename}`;
}

router.get('/_static/:fileid', (req, res, next) => {
    const fileid = req.params.fileid;
    const filename = cache[fileid];
    if (!filename) {
        return next();
    }
    if (!fs.existsSync(filename)) {
        console.error(`Cached file ${filename} not found...`);
        return next();
    }
    fs.createReadStream(null, {fd: cache[file]})
    res.send();
});

router.get('/:table/', (req, res) => {
    (async function () {
        const table = req.params.table;
        console.log(`Requested ${table}`)
        const params = req.query;
        let query = (function () {
            console.log("Params: ", params);
            const condition = Object
                .keys(params)
                .map(key => `${key} = :${key}`)
                .join(' AND ');
            const query = `SELECT * FROM HYDEX_3.${table} 
                ${condition.length
                ? 'WHERE'
                : ''} ${condition}`;
            return query;
        })();
        const args = Object
            .keys(params)
            .map(key => params[key]);
        console.log("Waiting for connection...");
        const conn = await(await db).getConnection();

        try {
            console.log("Connected, executing query: \n", query, args);

            const stream = await conn.queryStream(query, args, {
                resultSet: true,
                extendedMetaData: true
            });

            res.setHeader('Content-Type', 'application/json');

            let meta = undefined;
            let buffer = [];

            stream.on('error', function (error) {
                console.error('Got error from database: ', error);
                res.write(JSON.stringify(error.message));
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
                        for (let i = 0; i < row.length; ++i) {
                            if (meta[i].dbType === oracle.DB_TYPE_BLOB) {

                                const {path, fd} = tmpFile.fileSync();
                                console.log(`Caching to ${path}`);
                                // write the file
                                row[i].pipe(fs.createWriteStream(null, {fd: fd}));
                                // add stuff to cache
                                cache[query] = path;
                                // return url
                                row[i] = createUrlFromFilename(req.baseUrl, path);
                            }
                        }
                        return JSON.stringify(row);
                    }).join(','));
                    res.flush();
                    buffer = [];
                }
            });

            stream.on('end', function () {
                console.log("Connection closed");
                res.write(']}');
                conn.close();
                res.send();
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