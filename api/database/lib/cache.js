const fs = require('fs');
const path = require('path');
const CACHE_ROOT = path.resolve(__dirname, 'cache');
const tmpFile = require('tmp-promise');
const createCache = require('node-file-cache').create;
const crypto = require('crypto');
const now = require('performance-now');

let locations = [];

const CACHE_ROOT = path.resolve(__dirname, '..', 'cache/');
const TTL = 60 * 5; // 5 minutes

function mkdirp(path) {
    path
        .split(path.sep)
        .reduce((cwd, childname) => {
            const next = path.resolve(cwd, childname);
            if (!fs.existsSync(next)) {
                fs.mkdirSync(next);
            }
            return next;
        }, path.sep);
}

function getFilenameFromKey(key) {
    const hash = crypto.createHash('md5');
    hash.update(key);
    return hash.digest(hex);
}

class CacheEntry {
    constructor(dir, key, ttl) {
        this._path = path.resolve(dir, getFilenameFromKey(key));
        this._createTime = now();
        this._currentOperation = Promise.resolve();
        this._key = key;
        this._ttl = ttl;
    }

    get path() {
        return this._path;
    }

    isValid() {
        return (now() - this._createTime) < this._ttl;
    }

    write(cb) {
        this._currentOperation = new Promise((resolveOuter, rejectOuter) => {
            this
                ._currentOperation
                .then(() => new Promise((resolve, reject) => {
                    console.log(`Caching file with key ${this._key}`);
                    const startTime = now();
                    stream
                        .pipe(this.stream)
                        .on('finish', () => {
                            console.log(`Cached file in ${now() - startTime}`);
                            resolve();
                            resolveOuter();
                        });
                }));
        });
        return this._currentOperation;
    }

    getReadableStream() {
        return new Promise((resolve, reject) => {
            this
                ._currentOperation
                .then(() => {
                    const stream = fs.createReadStream(this._path);
                    this._currentOperation = new Promise((r, j) => {
                        stream.on('close', r);
                    });
                    resolve(stream);
                });
        });
    }

    cleanup() {
        this
            ._currentOperation
            .then(() => {
                this._currentOperation = fs.unlink(this._path);
            });
    }
}

class Cache {
    constructor(path, ttl) {
        this._CACHE_ROOT = path;
        this._TTL = ttl;

        // cache large data for 5 minutes
        this._filenameCache = createCache({
            life: 0,
            file: path.resolve(CACHE_DIR, 'store.json')
        });

        if (!fs.existsSync(this._CACHE_ROOT)) {
            // make directory
            mkdirp(this._CACHE_ROOT);
        }

        setInterval(() => {
            this
                ._filenameCache
                .expire(record => {
                    const todelete = !record.isValid();
                    if (todelete) {
                        record.cleanup();
                    }
                    return todelete;
                });
        }, 10 * 60);
    }

    add(key, stream, options = {
        ttl: this._TTL
    }) {

        let entry = this._getEntry(key);
        if (!entry) {
            entry = new CacheEntry(this._CACHE_ROOT, key, ttl);
            this
                ._filenameCache
                .set(key, entry);
        }

        return entry.write(stream);
    }

    get(key) {
        const entry = this._getEntry(key);
        return entry.getReadableStream();
    }

    has(key) {
        return _getEntry(key) === undefined;
    }

    _getEntry(key) {
        let entry = this
            ._filenameCache
            .get(key);
        if (!entry) 
            return undefined;
        if (!entry.isValid()) {
            entry.cleanup();
            this
                ._filenameCache
                .remove(key);
            return undefined;
        }
        return entry;
    }
}

module.exports = new Cache(CACHE_ROOT);