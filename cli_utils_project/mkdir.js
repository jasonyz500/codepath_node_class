#!/usr/bin/env node
"use strict";

require('./helper')
let fs = require('fs').promise
var args = require('yargs').argv
var mkdirp = require('mkdirp')

function* mkdir() {
	mkdirp(args._[ 0 ])
}

module.exports = mkdir
