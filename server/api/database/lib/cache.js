const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const now = require('performance-now');
const NodeCache = require('node-cache');

const debug = require('debug')('api:database:cache');

const CACHE_ROOT = path.resolve(__dirname, '..', 'cache/');

// life of files
const TTL = 60 * 10; // 5 minutes

/** Delay before writing stream to file in millis
 *  Having a delay here lowers priority of writing to a file
 */
const WRITE_DELAY = 200;

const delayPromise = (ms) => new Promise((r, _) => setTimeout(r, ms));
function mkdirp(dir) {
    dir
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
    return hash.digest('hex');
}

class FileWrapper {
    constructor(dir, name) {
        this._path = path.resolve(dir, getFilenameFromKey(name));
        this._lastUpdated = now();
        this._name = name;
        this._currentOperation = Promise.resolve();
    }

    write(inputStream, delay) {
        this._currentOperation = this
            ._currentOperation
            .then(() => delayPromise(delay))
            .then(() => new Promise((resolve, _) => {
                this._lastUpdated = now();
                const stream = fs.createWriteStream(this._path);
                const startTime = now();
                inputStream
                    .pipe(stream)
                    .on('finish', () => {
                        debug(`Wrote ${this._name} to ${this._path} in ${now() - startTime}`);
                        resolve();
                    });
            }));
        return this._currentOperation;
    }

    getReadableStream() {
        this._currentOperation = this
            ._currentOperation
            .then(() => new Promise((resolve, _) => {
                const stream = fs
                    .createReadStream(this._path)
                    .on('open', () => resolve(stream));
            }));
        return this._currentOperation;
    }

    cleanup() {
        return this._currentOperation = this
            ._currentOperation
            .then(() => {
                this._currentOperation = fs.unlinkSync(this._path);
            });
    }

}

class Cache {
    constructor(dir, ttl = TTL) {
        this._CACHE_ROOT = dir;
        this._TTL = ttl;

        if (!fs.existsSync(this._CACHE_ROOT)) {
            // make directory
            mkdirp(this._CACHE_ROOT);
        }

        // cache large data for 5 minutes
        this._filenameCache = new NodeCache({
            stdTTL: this._TTL,
            errorOnMissing: false,
            checkperiod: this._TTL / 2,
            useClones: false
        });
        this._cleanup = this
            ._cleanup
            .bind(this);
        this
            ._filenameCache
            .on('del', this._cleanup)
        process.on('exit', () => {
            console.error(`***************We're exiting!!!****************`);
            this
                ._filenameCache
                .del(this._filenameCache.keys());
        });
    }

    _cleanup(key, record) {
        debug(`Cleaning up ${record}`, record);
        record.cleanup();
    }

    add(key, stream, {ttl} = {
        ttl: this._TTL
    }) {
        let entry = this._getEntry(key);
        if (!entry) {
            entry = new FileWrapper(this._CACHE_ROOT, key);
            this
                ._filenameCache
                .set(key, entry, ttl);
        } else {
            entry.resetTimer();
            debug(`${key} already in cache; overwriting`);
        }

        return entry.write(stream, WRITE_DELAY);
    }

    get(key) {
        const entry = this._getEntry(key);
        if (!entry) 
            return Promise.resolve();
        return entry.getReadableStream();
    }

    has(key) {
        return this._getEntry(key) !== undefined;
    }

    _getEntry(key) {
        let entry = this
            ._filenameCache
            .get(key);
        if (!entry) {
            return undefined;
        }
        return entry;
    }
}

module.exports = new Cache(CACHE_ROOT);