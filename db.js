const dbConfig = require('./dbconfig.js');
const oracledb = require('oracledb');

oracledb.fetchAsString = [oracledb.CLOB];
oracledb.fetchAsBuffer = [];

console.log("Creating pool...");
const connectionPool = oracledb
    .createPool({user: dbConfig.user, password: dbConfig.password, connectString: dbConfig.connectString})
    .catch(err => {
        console.error(`Failed to create db connection: ${err}`);
        throw err;
    });
module.exports = connectionPool;