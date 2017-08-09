// import fs from 'fs';
// import {resolve, join} from 'path';
// import cp from 'child_process';
const cp = require('child_process');

const argv = require('minimist')(process.argv.slice(2));
const runAll = require('npm-run-all');

const REACT_DIR = './react';

process.chdir(REACT_DIR);

// run server
function runscript (args, options) {
    runAll(args, Object.assign({
        stdin: process.stdin,
        stdout: process.stdout,
        stderr: process.stderr,
    }, options));
}

let options = Object.assign({}, argv, { _: undefined });
argv._.forEach(runscript, options);