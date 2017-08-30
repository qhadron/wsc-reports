'use strict';

/**
 *
 * @param {string} url  Query url
 * @param {} obj Key value pairs sent to server
 * @param {*} options Options to pass to fetch
 */
export function sendJSON(url, obj, options = {}) {
    if (!options['Content-Type']) {
        options['Content-Type'] = 'application/json';
    }
    if (!options['method']) {
        options['method'] = 'GET';
    }
    if (options['method'] === 'GET') {
        url = url instanceof URL
            ? url
            : new URL(url, window.location.href);
        for (const key in obj) {
            url
                .searchParams
                .set(key, obj[key]);
        }
    } else {
        if (!options['body']) {
            options.body = JSON.stringify(obj);
        }
    }
    return fetch(url, options);
}

function processDatabaseReturn(res) {
    return res
        .json()
        .then(res => {
            if (typeof res.rows !== 'undefined') {
                res.rows = res
                    .rows
                    .filter(x => x.length);
            }
            return res;
        });
}

/**
 *
 * @param {string} statement
 */
export function queryDatabaseSql(statement) {
    const url = new URL(`/api/database/admin/sql/`, window.location);
    return sendJSON(url, {
        q: statement
    }, {method: 'POST'}).then(processDatabaseReturn);
}

export function queryDatabaseList() {
    const url = new URL(`/api/database/`, window.location.href);
    return sendJSON(url).then(r => r.json());
}

export function addQuery(query) {
    const url = new URL('/api/database/admin/manage/', window.location.href);
    return sendJSON(url, {
        query: query
    }, {method: 'PUT'}).then(r => r.json());
}

export function removeQuery(id) {
    const url = new URL(`/api/database/admin/manage/${id}/`, window.location.href);
    return fetch(url, {method: 'DELETE'}).then(r => r.json());
}
export function queryDatabaseQueryId(id) {
    const url = new URL(`/api/database/${id}/`, window.location.href);
    return fetch(url).then(processDatabaseReturn);
}

export default {
    sendJSON,
    queryDatabaseSql,
    queryDatabaseList,
    queryDatabaseQueryId
};