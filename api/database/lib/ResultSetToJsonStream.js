const {Readable} = require('stream');
const crypto = require('crypto');
const oracledb = require('oracledb');

const MAX_RESULT_COUNT = 10;

/**
 *
 * @param {String} query
 * @param {Array} row
 */
function getKey(row, idx) {
    const hash = crypto.createHash('md5');
    row
        .filter(x => x !== null && x.dbType !== oracledb.DB_TYPE_BLOB && x.dbType !== oracledb.DB_TYPE_CLOB)
        .forEach(x => hash.update(x.toString()));
    return `${hash.digest('hex')}-${idx}`;
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
        this._readFinishedCb = readFinishedCallback;
        this._readPromises = [];
        this._max = max;
        this._cleanup = this
            ._cleanup
            .bind(this);
        console.log('Created json stream');
        this.on('error', this._cleanup);
    }
    _writeHeader() {
        this.push('{');
        this.push(`"metaData": ${JSON.stringify(this._meta)}`);
        this.push(', "rows": [[]');
    }

    _writeFooter() {
        this.push(']}');
    }

    _fetch() {
        const fetchCount = Math.min(this._max - this._processedRows, oracledb.maxRows || 100);
        this
            ._resultSet
            .getRows(fetchCount)
            .then(rows => {
                this._fetching = false;
                console.log(`Fetched ${rows.length} rows`);
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

    _read(size) {
        // check if we're already done
        if (this._closed) 
            return;
        
        if (!this._writtenHead) {
            this._writeHeader();
            this._writtenHead = true;
            return;
        }
        // check for cached data
        if (this._fetchedRows.length) {
            return this.push(',' + this._processRow(this._fetchedRows.shift()));
        }
        // if we still have more to fetch
        if (!this._fetchedAll) {
            if (!this._fetching) {
                this._fetching = true;
                this._fetch();
            }
        } else {

            this._cleanup();
            this._writeFooter();
            this.push(null);

        }
    };

    _processRow(row) {
        const key = getKey(row, this._processedRows);
        for (let i = 0; i < row.length; ++i) {
            if (this._meta[i].dbType === oracledb.DB_TYPE_BLOB) {
                if (!this._cache.has(key)) {
                    this
                        ._readPromises
                        .push(this._cache.add(key, row[i]));
                }
                row[i] = this._getUrl(key);
            }
        }
        this._processedRows += 1;
        return JSON.stringify(row);
    }

    _cleanup() {
        this._closed = true;
        return Promise
            .all(this._readPromises)
            .then(() => {
                console.log('Fetched all rows, closing result set...');
                return this
                    ._resultSet
                    .close();
            })
            .then(this._readFinishedCb);
    }
};