const {Transform} = require('stream');
const fileType = require('file-type');
const mmm = require('mmmagic');
const Magic = new mmm.Magic(mmm.MAGIC_MIME_TYPE);

module.exports = class FileTypeStream extends Transform {
    static get BYTES_TO_BUFFER() {
        return 4 * 1024 * 1024; // 4 MiB
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
                this._parse(buf => cb(null, chunk));
            }
        } else {
            console.log('passthrough');
            cb(null, chunk); // passthrough
        }
    }

    _flush() {
        if (this._shouldBuffer && !this._parsed) {
            this._parse(buffer => this.push(buffer));
        }
    }

    _parse(callback) {
        console.log('Buffering');
        const buffer = Buffer.concat(this._buffers);
        this._buffers = null; // delete buffered data

        console.log(`Parsing using ${buffer.length} bytes`);

        let res = fileType(buffer);

        let done = res => {
            this.emit('filetype', res);
            this._parsed = true;
            this._shouldBuffer = false;
            console.log('parse done');
            callback(buffer);
        };

        Magic.detect(buffer, (err, type) => {
            if (err) {
                console.log(err);
            }
            if (res.mime !== type) {
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
                            ext: 'pptx',
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
                        break;
                }
                console.log(`Original: ${JSON.stringify(old)}, New: ${JSON.stringify(type)}, ext: ${res.ext}`);
                return done(res);
            }
        });
    }
}