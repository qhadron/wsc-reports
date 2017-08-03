const credentials = require('./dbconfig.js');
const oracle = require('oracledb');

const connectionPool = oracle.getConnection(credentials)
    .then(connection => {
        return connection.execute(
            "SELECT * FROM HYDEX_3.WSC_STN_LKUP WHERE WSC_STN_NO = :id",
            ["99ZZ012"]
        ).then(res => {
            console.log(res.rows());
        }).catch(err => {
            console.error(err);
        }).then(_ => {
            return connection.close();
        });
}).catch(err => {
    console.error(err);
});