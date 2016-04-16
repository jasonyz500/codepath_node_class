#!/usr/bin/env node
"use strict";

require('./helper')
let fs = require('fs').promise
var args = require('yargs').argv
let path = require('path')

function* ls(rootDir) {
	let fileNames = yield fs.readdir(rootDir)
	for (var f in fileNames) {
		let filePath = path.join(rootDir, fileNames[f])
		let stat = yield fs.stat(filePath)
		if (stat.isDirectory()) {
			if (args.R) {
				yield ls(filePath)
			}
		} else {
			process.stdout.write(filePath + '\n')
		}
	}
}

function* main() {
	yield ls(args._[ 0 ])
}

module.exports = main
