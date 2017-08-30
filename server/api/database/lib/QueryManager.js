const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const APPROOT = process.cwd();
const FILE_PATH = path.resolve(APPROOT, 'config', 'queries.xml')
const {promisify} = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const parseString = promisify(xml2js.parseString);
const parserOpts = {
    explicitArray: false
};

/*
    <queries>
        <query>
            <id></id>
            <displayName></displayName>
            <description></description>
            <sql><sql>
        </query>
        ...
    </queries>
*/

class Query {
    constructor(id, displayName, description, sql) {
        this.id = id;
        if (!this.id) {
            throw new TypeError('Id cannot be null for a query');
        }
        this.displayName = displayName;
        this.description = description;
        this.sql = sql;
    }
    static compare(a, b) {
        return a
            .id
            .localeCompare(b.id);
    }
    compareTo(other) {
        return this
            .id
            .localeCompare(other.id);
    }
}

let currentOperation = Promise.resolve();

function _validate(queries) {
    const set = new Set();
    return queries
        .filter(val => val.id)
        .filter(val => {
            return val.id && set.has(val.id)
                ? false
                : set.add(val.id)
        })
        .sort(Query.compare);
}
function addQuery(query) {
    return currentOperation = currentOperation.then(() => {
        return _readQueries().then(queries => {
            const idx = queries.findIndex(x => x.id === query.id);
            if (idx !== -1) {
                queries[idx] = query;
            } else {
                queries.push(query);
            }
            return _writeQueries(queries);
        });
    });
}

function getQueries() {
    return currentOperation = currentOperation.then(() => {
        return _readQueries();
    })
};

function writeQueries(queries) {
    return currentOperation = currentOperation.then(() => {
        return _writeQueries(queries);
    });
}

function removeQuery(id) {
    return currentOperation = currentOperation.then(() => {
        return _readQueries().then(queries => {
            if (!queries.find(x => x.id === id)) {
                throw new Error(`The query with id ${id} was not found.`);
            }
            return _writeQueries(queries.filter(x => x.id !== id));
        })
    });

}

function _writeQueries(queries) {
    const builder = new xml2js.Builder();
    const newQueries = _validate(queries).map(elem => ({query: elem}));
    const str = builder.buildObject({queries: newQueries});
    return writeFile(FILE_PATH, new Buffer(str)).then(() => queries);
};
function _readQueries() {
    return readFile(FILE_PATH).then(text => {
        return parseString(text, parserOpts);
    }).then(data => {
        let q = data.queries.query;
        if (!q) {
            q = [];
        } else if (typeof q.length === 'undefined') {
            q = [q];
        }
        q = _validate(q);
        q = q.map(entry => new Query(entry.id, entry.displayName, entry.description, entry.sql));
        return q;
    }).catch(err => {
        console.error("Error reading queries, returning []", err);
        return [];
    });
};

module.exports = {
    addQuery: addQuery,
    getQueries: getQueries,
    writeQueries: writeQueries,
    removeQuery: removeQuery,
    Query: Query
};