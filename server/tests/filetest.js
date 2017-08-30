const fs = require('fs');
const FT = require('../api/database/lib/FileTypeStream');

function go(file) {
    fs
        .createReadStream(file)
        .pipe(new FT())
        .on('filetype', data => console.log(file, data))
        .on('error', err => console.log('ERROR: ', file, err))
        .on('end', () => console.log("end!"))
        .on('finish', () => console.log("finish!"))
        .pipe(process.stdout)
}

process
    .argv
    .slice(2)
    .forEach(go);