const {promisify} = require('util');
const QueryManager = require('../api/database/lib/QueryManager');
const crypto = require('crypto');

async function randString(len) {
    return promisify(crypto.randomBytes)(len / 2 + 1).then(res => {
        return res.toString('hex', 0, len - 1);
    });
}

async function main() {
    let queries;
    console.log('Starting');

    queries = await QueryManager.getQueries();
    console.log('Existing queries: ', queries);

    const query = new QueryManager.Query(await randString(10), await randString(10), await randString(10), await randString(10));

    queries = await QueryManager.addQuery(query);
    console.log('Added queries: ', queries);

    console.log('First query: ', queries[0])
}

main();