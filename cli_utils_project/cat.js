#!/usr/bin/env node
'use strict';

require('./helper')
let fs = require('fs').promise
var args = require('yargs').argv

function* cat() {
	var contents = yield fs.readFile(args._[ 0 ])
	process.stdout.write(contents)
}

module.exports = cat
