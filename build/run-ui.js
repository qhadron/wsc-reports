const argv = require('minimist')(process.argv.slice(2));
const runAll = require('npm-run-all');

const UI_DIR = './ui';

process.chdir(UI_DIR);

// run server
function runscript(args, options) {
    runAll(args, Object.assign({
        stdin: process.stdin,
        stdout: process.stdout,
        stderr: process.stderr
    }, options));
}

let options = Object.assign({}, argv, {_: undefined});
argv
    ._
    .forEach(runscript, options);