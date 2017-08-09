'use strict';

/**
 *
 * @param {string} url  Query url
 * @param {} obj Key value pairs sent to server
 * @param {*} options Options to pass to fetch
 */
function sendJSON(url, obj, options = {}) {
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
            options.body = JSON.stringify('obj');
        }
    }
    return fetch(url, options);
}

/**
 *
 * @param {string} tablename Name of table to query
 * @param {*} conditions  Key value pairs that all must be true
 */
function queryDatabase(tablename, conditions) {
    return sendJSON(new URL(`/api/database/${tablename.toUpperCase()}`, window.location), conditions);
}

export default {
    sendJSON,
    queryDatabase
};