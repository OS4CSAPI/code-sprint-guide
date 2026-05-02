'use strict';
const fs = require('fs');
const upath = require('upath');
const pug = require('pug');
const sh = require('shelljs');
const prettier = require('prettier');

const projectRoot = upath.resolve(upath.dirname(__filename), '..');
const eventsDir = upath.join(projectRoot, 'events');

const eventsById = {};
const eventsList = [];
if (sh.test('-d', eventsDir)) {
    sh.find(eventsDir).forEach(function (filePath) {
        if (!filePath.match(/\.json$/)) return;
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const key = data.id || upath.basename(filePath, '.json');
        eventsById[key] = data;
        eventsList.push(data);
    });
    eventsList.sort(function (a, b) {
        return new Date(a.startDateTimeISO) - new Date(b.startDateTimeISO);
    });
}

module.exports = function renderPug(filePath) {
    const destPath = filePath
        .replace(/.*\/src\/pug\//, 'dist/')
        .replace(/\.pug$/, '.html');
    const srcPath = upath.resolve(upath.dirname(__filename), '../src');

    console.log(`### INFO: Rendering ${filePath} to ${destPath}`);
    const html = pug.renderFile(filePath, {
        doctype: 'html',
        filename: filePath,
        basedir: srcPath,
        events: eventsList,
        eventsById: eventsById
    });

    const destPathDirname = upath.dirname(destPath);
    if (!sh.test('-e', destPathDirname)) {
        sh.mkdir('-p', destPathDirname);
    }

    const prettified = prettier.format(html, {
        printWidth: 1000,
        tabWidth: 4,
        singleQuote: true,
        proseWrap: 'preserve',
        endOfLine: 'lf',
        parser: 'html',
        htmlWhitespaceSensitivity: 'ignore'
    });

    fs.writeFileSync(destPath, prettified);
};
