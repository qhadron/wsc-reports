import fs from 'fs';
import path from 'path';
import browserify from 'browserify';
import watchify from 'watchify';

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

function mkdirp(dir) {
    let cur = path.resolve(dir);
    try {
        fs.mkdirSync(dir);
    } catch (e) {
        switch (e.code) {
            case 'ENOENT':
                mkdirp(path.dirname(cur));
                mkdirp(cur);
                break;
        }
    }
}

const locations = [
    {
        path: 'js/admin',
        dest: 'static/admin/js'
    }, {
        path: 'js/public',
        dest: 'static/public/js'
    }
];

locations.forEach(({path: folder, dest}) => fs.readdir(folder, (err, items) => {
    if (err) 
        return;
    items = items.filter(str => /\.jsx?$/.exec(str));
    items = items.map(item => path.resolve(folder, item));
    console.log('Found js files: ', items);
    items.forEach(item => build(item, path.resolve(dest, path.basename(item))));
}));

function build(input, output) {
    const b = browserify(input, browserifyConfig);
    mkdirp(path.dirname(output));

    function bundle() {
        console.log("Writing to ", output);
        b
            .transform('babelify')
            .bundle()
            .on('error', err => {
                try {
                    console.error(`Error in file ${err.filename}:${err.line}:${err.column}`, err.codeFrame);
                } catch (e) {
                    console.error(err);
                }
            })
            .pipe(fs.createWriteStream(output));
    }

    if (process.env.NODE_ENV === "development") {
        console.log("Watching for changes in ", input);
        b.on('update', bundle);
    }
    b.on('log', msg => {
        console.log(msg);
    });

    bundle();
}
