"use strict";
let http = require('http');
let fs = require('fs');
let request = require('request');
let argv = require('yargs').argv;


let logStream = argv.logfile ? fs.createWriteStream(argv.logfile) : process.stdout;
let localhost='127.0.0.1';
let scheme = 'http://';
let host = argv.host || localhost;
let port = argv.port || (host === localhost ? 8000 : 80);
let destinationUrl = scheme + host + ':' + port;

http.createServer((req, res) => {
	logStream.write(`Proxying request to: ${destinationUrl + req.url}`)
	let url = destinationUrl;
	if (req.headers["x-destination-url"]) {
		url = 'http://' + req.headers["x-destination-url"]
	}
	let options = {
        headers: req.headers,
    	url: url + req.url
	}
	options.method = req.method
	req.pipe(request(options)).pipe(res)
}).listen(8001)

http.createServer((req, res) => {
    logStream.write(`Request received at: ${req.url}`)
	for (let header in req.headers) {
    	res.setHeader(header, req.headers[header])
	}
	req.pipe(res)	
}).listen(8000)
