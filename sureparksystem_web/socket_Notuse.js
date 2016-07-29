var express = require('express');
var path = require('path');

var net = require('net');
/*
var client = new net.Socket();
client.connect(1337, '127.0.0.1', function() {
	console.log('Connected');
	client.write('Hello, server! Love, Client.');
});

client.on('data', function(data) {
	console.log('Received: ' + data);
	client.destroy(); // kill client after server's respons1e
});

client.on('close', function() {
	console.log('Connection closed');
});

*/
function getConnection(connName, connIp) {
	var client = net.connect({
		port : 1004,
		host : connIp
	}, function() {
		console.log(connName + ' Connected: ');
		console.log('   local = %s:%s', this.localAddress, this.localPort);
		console.log('   remote = %s:%s', this.remoteAddress, this.remotePort);
		this.setTimeout(10000);
		this.setEncoding('utf8');
		this.on('data', function(data) {
			console.log(connName + " From Server: " + data.toString());
			this.end();
		});
		this.on('end', function() {
			console.log(connName + ' Client disconnected');
		});
		this.on('error', function(err) {
			console.log('Socket Error: ', JSON.stringify(err));
		});
		this.on('timeout', function() {
			console.log('Socket Timed Out');
		});
		this.on('close', function() {
			console.log('Socket Closed');
		});
	});
	return client;
}

function writeData(socket, data) {
	var success = !socket.write(data);
	if (!success) {
		(function(socket, data) {
			socket.once('drain', function() {
				writeData(socket, data);
			});
		})(socket, data);
	}
}

/*
 * var rs; var send='phswow77 2016-07-23 08:00:00'; 
 * var client = net.connect(1004,'192.168.1.138'); 
 * client.write(send, 'utf8');
 * client.on('data', function(chunk){ console.log('recv:' + chunk); });
 * client.end();
 */

module.exports.getConnection = getConnection;
