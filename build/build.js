const fs = require('fs');
const browserify = require('browserify');
const watchify = require('watchify');

fs.readdir('js/', (err, items) => {
    items = items.filter(str => /\.js$/.exec(str));
    console.log('Found js files: ', items);
    items.forEach(file => package(`js/${file}`));
});

function package(file) {
    const b = browserify(file, {cache: {}, packageCache: {}, plugin: [watchify], debug: true});
    const dest = `static/${file}`;

    function bundle() {
        console.log("Writing to ", dest);
        b.transform('babelify', {presets: ["es2015"]})
            .bundle()
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
