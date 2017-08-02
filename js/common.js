'use strict';

function sendJSON(url, obj, options={}) {
    if (!options['Content-Type']) {
        options['Content-Type'] = 'application/json';
    }
    if (!options['method']) {
        options['method'] = 'GET';
    }
    if (options['method'] === 'GET') {
        url = new URL(url, window.location.href); 
        for (const key in obj) {
            url.searchParams.set(key, obj[key]);
        }
    } else {
        if (!options['body']) {
            options.body = JSON.stringify('obj');
        }
    }
    return fetch(url, options);
}

module.exports.sendJSON = sendJSON;