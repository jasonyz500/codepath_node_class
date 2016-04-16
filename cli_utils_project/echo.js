#!/usr/bin/env node
"use strict";

require('./helper')
let fs = require('fs').promise
var args = require('yargs').argv

function* echo() {
    // Use 'yield' in here
    // Your implementation here
    process.stdout.write(args._[ 0 ] + '\n' || '')
}

module.exports = echo
