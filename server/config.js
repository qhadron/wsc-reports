const path = require('path');

const APPROOT = process.cwd();
export const configpath = path.resolve(APPROOT, 'config', 'serverconfig');

const userconfig = (() => {
    try {
        return require(configpath);
    } catch (e) {
        console.log(`Invalid server configuration, see ${configpath}.js.sample for more details`);
        return {};
    }
})();

export const config = Object.assign({
    port: process.env.PORT || 3000,
    host: null,
    trustProxy: false,
    ssl_cert_path: '',
    ssl_key_path: ''
}, userconfig);

export default config;