#!/usr/bin/env node
"use strict";

require('./helper')
let fs = require('fs').promise
var args = require('yargs').argv
var path = require('path')

function* touch() {
	var now = Date.now() / 1000
	var file = yield fs.open(path.join(process.cwd(), args._[ 0 ]), 'a')
	yield fs.futimes(file, now, now)
}

module.exports = touch
