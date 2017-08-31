if (process.env.NODE_ENV === 'development') {
    const namespaces = ['server', 'db', 'api:*']
    process.env['DEBUG'] = namespaces.join(',');
    require('debug');
}

const app = require('./app');
const fs = require('fs');
const https = require('https');
const config = require('./config');
const {ssl_cert_path, ssl_key_path, port, host} = config.config;
const configpath = config.configpath;

let server = app;

const mounted_callback = () => {
    console.log(`Server listening at ${server.address().family} ${server.address().address} ${server.address().port}`)
};

try {
    server = https.createServer({
        key: fs.readFileSync(ssl_key_path),
        cert: fs.readFileSync(ssl_cert_path)
    }, app);
} catch (err) {
    console.log(`Error reading ssl configuration. Edit ${configpath}.js to enable ssl...`);
}

if (host) {
    server = server.listen(port, host, mounted_callback);
} else {
    server = server.listen(port, mounted_callback);
}