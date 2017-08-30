if (process.env.NODE_ENV === 'development') {
    const namespaces = ['server', 'db', 'api:*']
    process.env['DEBUG'] = namespaces.join(',');
    require('debug');
}

const app = require('./app');
const fs = require('fs');
const https = require('https');
const path = require('path');

const port = process.env.PORT || 3000;
const APPROOT = process.cwd();
const configpath = path.resolve(APPROOT, 'config', 'serverconfig');

const debug = require('debug')('server');

try {
    const {ssl_key_path, ssl_cert_path} = require(configpath);

    https.createServer({
        key: fs.readFileSync(ssl_key_path),
        cert: fs.readFileSync(ssl_cert_path)
    }, app).listen(port, () => {
        debug(`Express ssl server listening on port ${port}`);
    });
} catch (err) {
    console.warn(`Error reading ssl configuration. Edit ${configpath}.js to enable ssl...`);
    app.listen(port, () => {
        debug(`Express server listening on port ${port}`);
    });
}