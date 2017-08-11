const fs = require('fs');
const browserify = require('browserify');
const watchify = require('watchify');

const IS_DEV = process.env.NODE_ENV === "development";

const plugins = [];
if (IS_DEV) {
    plugins.push(watchify);
}

const browserifyConfig = {
    cache: {},
    packageCache: {},
    plugin: plugins
};

if (IS_DEV) {
    Object.assign(browserifyConfig, {debug: true});
}

fs.readdir('js/', (err, items) => {
    items = items.filter(str => /\.js$/.exec(str));
    console.log('Found js files: ', items);
    items.forEach(file => build(`js/${file}`));
});

function build(file) {
    const b = browserify(file, browserifyConfig);
    const dest = `static/${file}`;

    function bundle() {
        console.log("Writing to ", dest);
        b
            .transform('babelify')
            .bundle()
            .on('error', err => {
                const {
                    filename,
                    loc: {
                        line,
                        column
                    },
                    codeFrame
                } = err;
                console.error(`Error in file ${filename}:${line}:${column}`, codeFrame);
            })
            .pipe(fs.createWriteStream(dest));
    }

    if (process.env.NODE_ENV === "development") {
        console.log("Watching for changes in ", file);
        b.on('update', bundle);
    }
    b.on('log', msg => {
        console.log(msg);
    });

    bundle();
}
