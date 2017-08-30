const {Readable} = require('stream');
const crypto = require('crypto');
const oracledb = require('oracledb');
const debug = require('debug')('api:database:lib:resultsetstream');

// const MAX_RESULT_COUNT = 10;
const MAX_RESULT_COUNT = Number.POSITIVE_INFINITY;

/**
 *
 * @param {String} query
 * @param {Array} row
 */
function getKey(row, column_name) {
    const hash = crypto.createHash('md5');
    row
        .filter(x => x !== null && x.dbType !== oracledb.DB_TYPE_BLOB && x.dbType !== oracledb.DB_TYPE_CLOB)
        .forEach(x => hash.update(x.toString()));
    hash.update(column_name);
    return `${hash.digest('hex')}`;
}

module.exports = class ResultSetToJsonStream extends Readable {
    constructor(resultSet, cache, getUrl, readFinishedCallback, max = MAX_RESULT_COUNT) {
        super({});
        this._resultSet = resultSet;
        this._fetchedRows = [];
        this._writtenHead = false;
        this._meta = resultSet.metaData;
        this._cache = cache;
        this._getUrl = getUrl;
        this._processedRows = 0;
        this._closed = false;
        this._writtenFooters = false;
        this._readFinishedCb = readFinishedCallback;
        this._readPromises = [];
        this._max = max;
        this._cleanup = this
            ._cleanup
            .bind(this);

        this._blobIndices = this
            ._meta
            .reduce((acc, val, idx) => {
                if (val.dbType === oracledb.DB_TYPE_BLOB || val.dbType === oracledb.DB_TYPE_CLOB) 
                    acc.push(idx);
                return acc;
            }, []);
        debug('Created json stream');
        this.on('error', this._cleanup);
    }
    _writeHeader() {
        let headers = [];
        headers.push('{');
        headers.push(`"metaData": ${JSON.stringify(this._meta)}`);
        headers.push(', "rows": [[]');
        this.push(headers.join(''));
    }

    _writeFooter() {
        this._writtenFooters = true;
        this.push(']}');
    }

    _fetch() {
        const fetchCount = Math.min(this._max - this._processedRows, oracledb.maxRows || 100);
        if (fetchCount <= 0) {
            this._fetchedAll = true;
            return this._read();
        }
        this
            ._resultSet
            .getRows(fetchCount)
            .then(rows => {
                this._fetching = false;
                debug(`Fetched ${rows.length} rows`);
                this._fetchedRows = rows;
                if (this._fetchedRows.length < fetchCount) {
                    this._fetchedAll = true;
                } else if (this._processedRows >= this._max) {
                    this._fetchedAll = true;
                }

                this._read();
            })
            .catch(err => this.emit('error', err));
    }

    _read() {
        // check if we're already done
        if (this._closed) 
            return;
        
        if (!this._writtenHead) {
            this._writeHeader();
            this._writtenHead = true;
            return;
        }

        // check for cached data
        if (this._fetchedRows.length > 0) {
            return this.push(',' + this._processRow(this._fetchedRows.shift()));
        }

        // if we still have more to fetch
        if (!this._fetchedAll) {
            if (!this._fetching) {
                this._fetching = true;
                this._fetch();
                return;
            }
        } else {
            if (!this._writtenFooters) {
                this._writeFooter();
                this.push(null);
                debug('pushed null');
                if (!this._closed) {
                    this._cleanup();
                }
            }
        }
    };

    _processRow(row) {
        for (let i of this._blobIndices) {
            const key = getKey(row, this._meta[i].name);
            if (!this._cache.has(key)) {
                this
                    ._readPromises
                    .push(this._cache.add(key, row[i]));
            }
            row[i] = this._getUrl(key);
        }
        this._processedRows += 1;
        return JSON.stringify(row);
    }

    _cleanup() {
        this._closed = true;
        return Promise
            .all(this._readPromises)
            .then(() => { //.map(x => delay(1000).then(() => this._cache.add(...x)))).then(() => {
                debug('read all rows, closing result set...');
                return this
                    ._resultSet
                    .close();
            })
            .then(this._readFinishedCb);
    }
};