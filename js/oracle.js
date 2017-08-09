export const TYPES = {
    BLOB: 2007, // Bind a BLOB to a Node.js Stream or create a temporary BLOB, or for fetchAsBuffer and fetchInfo
    BUFFER: 2005, // Bind a RAW or BLOB to a Node.js Buffer
    CLOB: 2006, // Bind a CLOB to a Node.js Stream, create a temporary CLOB, or for fetchAsString and fetchInfo
    CURSOR: 2004, // Bind a REF CURSOR to a node-oracledb ResultSet class
    DATE: 2003, // Bind as JavaScript date type.  Can also be used for fetchAsString and fetchInfo
    DEFAULT: 0, // Used with fetchInfo to reset the fetch type to the database type
    NUMBER: 2002, // Bind as JavaScript number type.  Can also be used for fetchAsString and fetchInfo
    STRING: 2001, // Bind as JavaScript String type.  Can be used for most database types.
};
export const DB_TYPES = {
    DB_TYPE_BINARY_DOUBLE: 101, // BINARY_DOUBLE
    DB_TYPE_BINARY_FLOAT: 100, // BINARY_FLOAT
    DB_TYPE_BLOB: 113, // BLOB
    DB_TYPE_CHAR: 96, // CHAR
    DB_TYPE_CLOB: 112, // CLOB
    DB_TYPE_DATE: 12, // DATE
    DB_TYPE_NUMBER: 2, // NUMBER or FLOAT
    DB_TYPE_RAW: 23, // RAW
    DB_TYPE_ROWID: 104, // ROWID
    DB_TYPE_TIMESTAMP: 187, // TIMESTAMP
    DB_TYPE_TIMESTAMP_LTZ: 232, // TIMESTAMP WITH LOCAL TIME ZONE
    DB_TYPE_TIMESTAMP_TZ: 188, // TIMESTAMP WITH TIME ZONE
    DB_TYPE_VARCHAR: 1, // VARCHAR2
};
export const OUT_FORMAT = {
    ARRAY: 4001, // Fetch each row as array of column values
    OBJECT: 4002, // Fetch each row as an object
};
export const BIND_DIR = {
    BIND_IN: 3001, // Direction for IN binds
    BIND_INOUT: 3002, // Direction for IN OUT binds
    BIND_OUT: 3003, // Direction for OUT binds"
};
export default {
    TYPES,
    DB_TYPES,
    OUT_FORMAT,
    BIND_DIR
};
