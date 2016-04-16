#!/usr/bin/env node
"use strict";

require('./helper')
let fs = require('fs').promise
var args = require('yargs').argv
let path = require('path')
let ls = require('./ls')

function* deleteFiles(rootDir) {
	let fileNames = yield fs.readdir(rootDir)
	for (var f in fileNames) {
		let filePath = path.join(rootDir, fileNames[f])
		let stat = yield fs.stat(filePath)
		if (stat.isDirectory()) {
			yield deleteFiles(filePath)
			fs.rmdir(filePath)
		} else {
			yield fs.unlink(filePath)
		}
	}
}

function* main() {
	yield deleteFiles(args._[ 0 ])
	fs.rmdir(args._[ 0 ])
}

module.exports = main
