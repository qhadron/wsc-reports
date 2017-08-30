const path = require('path');
const approot = process.cwd();
const dbConfig = require(path.resolve(approot, 'config', 'dbconfig'));
const oracledb = require('oracledb');

oracledb.fetchAsString = [oracledb.CLOB];
oracledb.fetchAsBuffer = [];

console.log("Creating pool...");
const connectionPool = oracledb
    .createPool({user: dbConfig.user, password: dbConfig.password, connectString: dbConfig.connectString, queueRequests: true, _enableStats: true})
    .catch(err => {
        console.error(`Failed to create db connection: ${err}`);
        throw err;
    });
connectionPool.then(() => console.log('Pool created'));
module.exports = connectionPool;