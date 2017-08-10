const {Readable} = require('stream');
const crypto = require('crypto');
const oracledb = require('oracledb');

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

module.exports = class ResultSetToJsonStream {
    constructor(resultSet, cache, getUrl) {
        super({});
        this._resultSet = resultSet;
        this._fetchedRows = [];
        this._writtenHead = false;
        this._meta = resultSet.metaData;
        this._cache = cache;
        this._getUrl = getUrl;
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
        const fetchCount = oracledb.maxRows || 100;
        this
            ._resultSet
            .getRows(fetchCount)
            .then(rows => {
                this._fetchedRows = rows;
                if (this._fetchedRows.length < fetchCount) {
                    this._fetchedAll = true;
                }
                if (this._fetchedRows.length > 0) {
                    this._read();
                }
                return;
            });
    }

    _read(size) {
        if (!this._writtenHead) {
            _writeHeader();
            this._writtenHead = true;
            return;
        }
        // check for cached data
        if (this._fetchedRows.length) {
            this.push(',' + this._processRow(this._fetchedRows.shift()));
        }
        // if we still have more to fetch
        if (!this._fetchedAll) {
            if (!this._fetching) {
                this._fetching = true;
                this._fetch();
            }
        } else {
            this
                ._resultSet
                .close()
                .then(() => {
                    this._writeFooter();
                    this.push(null);
                    this._cleanup()
                });
        }
    };

    _processRow(row) {
        const key = key || getKey(query, row, i);
        for (let i = 0; i < row.length; ++i) {
            if (this._meta[i].dbType === oracle.DB_TYPE_BLOB) {
                if (!this._cache.has(key)) {
                    cache.add(key, row[i]);
                } else {
                    console.log('Serving file from cache...');
                }
                row[i] = this._getUrl(key);
            }
        }
        return JSON.stringify(row);
    }

    _cleanup() {
        this
            ._resultSet
            .close();
    }
};