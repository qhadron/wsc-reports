const {Transform} = require('stream');
const fileType = require('file-type');
const mmm = require('mmmagic');
const Magic = new mmm.Magic(mmm.MAGIC_MIME_TYPE);

module.exports = class FileTypeStream extends Transform {
    static get BYTES_TO_BUFFER() {
        return 4 * 1024 * 1024; // 1 MiB
    };
    constructor() {
        super();
        this._bytes_left = FileTypeStream.BYTES_TO_BUFFER;
        this._buffers = [];
        this._shouldBuffer = true;
        this._parsed = false;
    }

    _transform(chunk, encoding, cb) {
        if (this._shouldBuffer) {
            this
                ._buffers
                .push(chunk);
            if (chunk.length < this._bytes_left) {
                // pass through data & buffer
                this._bytes_left -= chunk.length;
                // ask for more data
                cb();
            } else {
                this._shouldBuffer = false;
                this._parse(buf => cb(null, buf));
            }
        } else {
            cb(null, chunk); // passthrough
        }
    }

    _flush(cb) {
        if (this._shouldBuffer && !this._parsed) {
            this._parse(buffer => cb(null, buffer));
        } else {
            cb();
        }
    }

    _parse(callback) {
        const buffer = Buffer.concat(this._buffers);
        this._buffers = null; // delete buffered data

        let res = fileType(buffer);

        let done = res => {
            if (!res.mime) 
                res = null;
            this.emit('filetype', res);
            this._parsed = true;
            this._shouldBuffer = false;
            callback(buffer);
        };

        Magic.detect(buffer, (err, type) => {
            if (!res || res.mime !== type) {
                if (!res) {
                    res = {
                        ext: null,
                        mine: null
                    }
                }
                const old = res.mime;
                switch (true) {
                    case type === 'application/msword':
                        Object.assign(res, {
                            ext: 'doc',
                            mime: type
                        });
                        break;
                    case type === 'application/vnd.ms-powerpoint':
                        Object.assign(res, {
                            ext: 'ppt',
                            mime: type
                        });
                        break;
                    case type.match(/wordprocessingml.document/):
                        Object.assign(res, {
                            ext: 'docx',
                            mime: type
                        });
                        break;
                    default:
                        if (res.ext === 'msi') {
                            res = null;
                        }
                        if (!res.mime) {
                            res.mime = type;
                        }
                        break;
                }
                console.log(`Original: ${JSON.stringify(old)}, New: ${JSON.stringify(type)}, ext: ${res && res.ext || null}`);
            }
            return done(res);
        });
    }
}