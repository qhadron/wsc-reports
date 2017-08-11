const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const now = require('performance-now');
const NodeCache = require('node-cache');

const CACHE_ROOT = path.resolve(__dirname, '..', 'cache/');
const TTL = 60 * 5; // 5 minutes

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
    write(inputStream) {
        this._currentOperation = this
            ._currentOperation
            .then(() => new Promise((resolve, _) => {
                this._lastUpdated = now();
                const stream = fs.createWriteStream(this._path);
                const startTime = now();
                inputStream
                    .pipe(stream)
                    .on('finish', () => {
                        console.log(`Wrote ${this._name} in ${now() - startTime}`);
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
                console.log(`Deleted ${path}`);
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
        console.log(`Cleaning up ${record}`, record);
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
            console.log(`${key} already in cache; overwriting`);
        }

        return entry.write(stream)
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