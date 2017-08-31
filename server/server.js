if (process.env.NODE_ENV === 'development') {
    const namespaces = ['server', 'db', 'api:*']
    process.env['DEBUG'] = namespaces.join(',');
    require('debug');
}

const app = require('./app');
const fs = require('fs');
const https = require('https');
const path = require('path');

const APPROOT = process.cwd();
const configpath = path.resolve(APPROOT, 'config', 'serverconfig');
const config = (() => {
    try {
        return require(configpath);
    } catch (e) {
        console.log(`Invalid server configuration, see ${configpath}.js.sample for more details`);
        return {
            port: process.env.PORT || 3000,
            host: undefined
        }
    }
})();

const debug = require('debug')('server');
const port = config.port;
const host = config.host;
let server = app;

const mounted_callback = () => {
    debug(`Server listening at ${server.address().family} ${server.address().address} ${server.address().port}`)
};

try {
    const {ssl_key_path, ssl_cert_path} = config;

    server = https.createServer({
        key: fs.readFileSync(ssl_key_path),
        cert: fs.readFileSync(ssl_cert_path)
    }, app);
} catch (err) {
    console.log(`Error reading ssl configuration. Edit ${configpath}.js to enable ssl...`);
}

if (host) 
    server = server.listen(port, host, mounted_callback);
else 
    server = server.listen(port, mounted_callback);