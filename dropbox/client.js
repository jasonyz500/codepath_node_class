let jot = require('json-over-tcp')
let fs = require('fs')
let path = require('path')
let rimraf = require('rimraf')
var mkdirp = require('mkdirp-promise')
let args = require('yargs').argv

const jotPort = 8001
const ROOT_DIRECTORY = args.dir || path.resolve(process.cwd())

function createConnection() {
	let socket = jot.connect(8001, function() {
		socket.write({
			question: "Hello world?"
		})
	})

	socket.on('data', function(data) {
		if (data.type === 'dir') {
			if (data.action === 'write') {
				mkdirp(ROOT_DIRECTORY + data.path, function() {})
			} else {
				rimraf.promise(ROOT_DIRECTORY + data.path)
			}
		} else {
			if (data.action === 'write') {
				let buffer = new Buffer(data.contents, 'base64')
				mkdirp(path.dirname(path.join(ROOT_DIRECTORY, data.path)), function() {
					fs.writeFile(ROOT_DIRECTORY + data.path, buffer, function() {
						console.log('wrote file: ' + ROOT_DIRECTORY + data.path)
					})
				})
			} else {
				fs.unlink(ROOT_DIRECTORY + data.path, function() {
					console.log('deleted file: ' + ROOT_DIRECTORY + data.path)
				})
			}
		}
	})
}

createConnection()