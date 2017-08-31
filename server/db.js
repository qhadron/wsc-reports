const path = require('path');
const approot = process.cwd();
const dbConfig = require(path.resolve(approot, 'config', 'dbconfig'));
const oracledb = require('oracledb');
const debug = require('debug')('db');

const POOL_SiZE = dbConfig.poolSize || 4;

oracledb.fetchAsString = [oracledb.CLOB];
oracledb.fetchAsBuffer = [];

/* set number of worker threads for oracledb
*  see https://github.com/oracle/node-oracledb/blob/master/doc/api.md#numberofthreads
*/
process.env.UV_THREAD_POOL_SIZE = POOL_SiZE;

debug("Creating pool...");
const connectionPool = oracledb
    .createPool({
    user: dbConfig.user,
    password: dbConfig.password,
    connectString: dbConfig.connectString,
    poolMax: POOL_SiZE,
    queueRequests: true,
    _enableStats: true
})
    .catch(err => {
        console.error(`Failed to create db connection: ${err}`);
        throw err;
    });
connectionPool.then(() => debug('Pool created'));
module.exports = connectionPool;