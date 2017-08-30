const path = require('path');
const approot = process.cwd();
const dbConfig = require(path.resolve(approot, 'config', 'dbconfig'));
const oracledb = require('oracledb');
const debug = require('debug')('db');

oracledb.fetchAsString = [oracledb.CLOB];
oracledb.fetchAsBuffer = [];

debug("Creating pool...");
const connectionPool = oracledb
    .createPool({user: dbConfig.user, password: dbConfig.password, connectString: dbConfig.connectString, queueRequests: true, _enableStats: true})
    .catch(err => {
        console.error(`Failed to create db connection: ${err}`);
        throw err;
    });
connectionPool.then(() => debug('Pool created'));
module.exports = connectionPool;