"use strict";
let fs = require('fs')
let path = require('path')
let express = require('express')
let morgan = require('morgan')
let nodeify = require('bluebird-nodeify')
let mime = require('mime-types')
let rimraf = require('rimraf')
let mkdirp = require('mkdirp')
let jot = require('json-over-tcp')
let archiver = require('archiver')
var chokidar = require('chokidar')
let args = require('yargs').argv

require('songbird')

const NODE_ENV = process.env.NODE_ENV
const PORT = process.env.PORT || 8000
const ROOT_DIRECTORY = args.dir || path.resolve(process.cwd())
const jotPort = 8001
var server = jot.createServer(jotPort)

var client_socket

let app = express()

if (NODE_ENV === 'development') {
	app.use(morgan('dev'))
}

app.listen(PORT, ()=> console.log(`LISTENING @ http://127.0.0.1:${PORT}`))
server.on('connection', newConnectionHandler)

app.get('*', setFilePath, sendHeaders, (req, res, next) => {
	if (res.body) {
		if (req.get('Accept') == 'application/x-gtar') {
			let archive = archiver('zip')
			archive.pipe(res);
			archive.bulk([
				{ expand: true, cwd: 'source', src: ['**'], dest: 'source'}
			])
			archive.finalize()
			return
		} else {
			res.json(res.body)
			return
		}
	}
	fs.createReadStream(req.filePath).pipe(res)
})

app.head('*', setFilePath, sendHeaders, (req, res, next) => res.end())

app.delete('*', setFilePath, (req, res, next) => {
	if(!req.stat) return res.send(400, 'Invalid Path')
	if(req.stat.isDirectory()) {
    	rimraf.promise(req.filePath)
    	if (client_socket) {
    		client_socket.write({
    			'action': 'delete',
    			'path': req.url,
    			'type': 'dir'
    		})
    	}
	} else {
		fs.promise.unlink(req.filePath)
    	if (client_socket) {
    		client_socket.write({
    			'action': 'delete',
    			'path': req.url,
    			'type': 'file'
    		})
    	}
	}
	res.end()
})

app.put('*', setFilePath, setDirDetails, (req, res, next) => {
	if(req.stat) return res.send(405, 'file exists')
	console.log(mkdirp.promise)
	mkdirp.promise(req.dirPath, function() {
		next()
	})
	if(!req.isDir) {
		req.pipe(fs.createWriteStream(req.filePath))
		if (client_socket) {
			fs.readFile(req.filePath, function(err, buffer) {
				client_socket.write({
					"action": "write",
					"path": req.url,
					"type": "file",
					"contents": buffer.toString("base64")
				})
			})
		}
	}
	res.end()
})

app.post('*', setFilePath, setDirDetails, (req, res, next) => {
	if(!req.stat) return res.send(405, 'file does not exist')
	if(req.isDir) return res.send(405, 'Path is a directory')
	fs.promise.truncate(req.filePath, 0, function() {
		
	})
	req.pipe(fs.createWriteStream(req.filePath))
	if (client_socket) {
		fs.readFile(req.filePath, function(err, buffer) {
			client_socket.write({
				"action": "write",
				"path": req.url,
				"type": "file",
				"contents": buffer.toString("base64")
			})
		})
	}
	res.end()
})

function setFilePath(req, res, next) {
	req.filePath = path.resolve(path.join(ROOT_DIRECTORY, req.url))
	if (req.filePath.indexOf(ROOT_DIRECTORY) !== 0) {
		res.send(400, 'Invalid file path')
		return
	}
	fs.stat(req.filePath, function(err, stat) {
		req.stat = stat
		next()
	})
}

function sendHeaders(req, res, next) {
	let filePath = req.filePath
	let stat = req.stat
	if (stat.isDirectory()) {
    	let files = fs.readdir(filePath, function(err, files) {
			res.body = JSON.stringify(files)
			res.setHeader('Content-Length', res.body.length)
			res.setHeader('Content-Type', 'application/json')
			next()
		})
	} else {
		res.setHeader('Content-Length', stat.size)
		let contentType = mime.contentType(path.extname(filePath))
		res.setHeader('Content-Type', contentType)
		next()
	}
}


function setDirDetails(req, res, next) {
	let filePath = req.filePath
	let endsWithSlash = filePath.charAt(filePath.length-1) === path.sep
	let hasExt = path.extname(filePath) !== ''

	req.isDir = endsWithSlash || !hasExt
	req.dirPath = req.isDir ? filePath : path.dirname(filePath)
	next()
}

function newConnectionHandler(socket) {
	client_socket = socket
	console.log('new socket')
}

server.listen(jotPort)

var watcher = chokidar.watch('.', {ignored: /[\/\\]\./})
watcher.on('add', path => {
	console.log(path)
	if (client_socket) {
		fs.readFile(path, function(err, buffer) {
			client_socket.write({
				"action": "write",
				"path": '/'+path,
				"type": "file",
				"contents": buffer.toString("base64")
			})
		})
	}
})

watcher.on('addDir', path => {
	console.log(path)
	if (client_socket) {
		fs.readFile(path, function(err, buffer) {
			client_socket.write({
				"action": "write",
				"path": '/'+path,
				"type": "dir",
				"contents": buffer.toString("base64")
			})
		})
	}
})

watcher.on('unlinkDir', path => {
	console.log(path)
	if (client_socket) {
		client_socket.write({
			'action': 'delete',
			'path': '/'+path,
			'type': 'dir'
		})
	}
})

watcher.on('unlink', path => {
	console.log(path)
	if (client_socket) {
		client_socket.write({
			'action': 'delete',
			'path': '/'+path,
			'type': 'file'
		})
	}
})

watcher.on('change', path => {
	if (client_socket) {
		fs.readFile(path, function(err, buffer) {
			client_socket.write({
				"action": "write",
				"path": '/'+path,
				"type": "file",
				"contents": buffer.toString("base64")
			})
		})
	}
})