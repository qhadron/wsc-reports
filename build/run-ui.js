const runAll = require('npm-run-all');
const {UI_PORT, UI_PATH} = require('../constants');
const express = require('express');
const cp = require('child_process');
const path = require('path');

process.chdir(UI_PATH);

let commands;

if (process.env.NODE_ENV === "development") {
    commands = [`develop -- -p ${UI_PORT}`];
} else {
    commands = ['build', `serve -- -p ${UI_PORT}`];
}

runAll(commands, {stdout: process.stdout}).then(() => {
    console.log(`ui server started`);
});