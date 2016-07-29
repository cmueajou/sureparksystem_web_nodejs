var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var mysql = require('mysql');
var net = require('net');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();
app.use("/semantic", express.static(__dirname + '/semantic'));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));




app.use('/', routes);
app.use('/users', users);

app.listen(3000, function() {
	console.log('App listening on port 3000!');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(session({
	secret : 'surepark',
	resave : false,
	saveUninitialized : true,
}));

var con = mysql.createConnection({
	host : 'localhost',
	user : 'root',
	password : 'g0t9d2e2',
	database : 'central'
});

var server = net.createServer(function(client) {
	  console.log('Client connection: ');
	  console.log('   local = %s:%s', client.localAddress, client.localPort);
	  console.log('   remote = %s:%s', client.remoteAddress, client.remotePort);
	  client.setEncoding('utf8');
	  client.on('data', function(data) {
	    console.log('Received data from client on port %d: %s',
	                client.remotePort, data.toString());
	    console.log('  Bytes received: ' + client.bytesRead);
	    writeData(client, 'Sending: ' + data.toString());
	    console.log('  Bytes sent: ' + client.bytesWritten);
	    //주차 5 아이디 시작시간 자리
	    //과금 6 아이디 엔드타임 피
	    var indata = data.toString().split(" ");
	    if(indata[0] === '5'){
	    	console.log('차량 주차 완료 : '+indata);
	    	var p1 = indata[2]+" "+indata[3];
	    	console.log('날짜 합치기 : '+p1+"|"+indata[4]+"|"+indata[1]);
	    	con.query('UPDATE reservation SET PARKING_START_TIME=?, ASSIGNED_PARKING_SPOT=? WHERE USER_ID=? and RESERVE_STATE <> ?', [p1,indata[4],indata[1],1],function(err, result, fields) {console.log('done parking');});
	    }else if(indata[0] === '6'){
	    	console.log('과금완료 : '+indata);
	    	var p2 = indata[2]+" "+indata[3];
	    	con.query('UPDATE reservation SET END_TIME=?, CHARGED_FEE=?, RESERVE_STATE=? WHERE USER_ID=? and RESERVE_STATE <> ?', [p2,indata[4],1,indata[1],1],function(err, result, fields) {console.log('done payment');});
	    }else if(indata[0] === '7'){
	    	console.log('예약 코드 삭제 : '+indata);
	    	
	    }else {
	    	console.log('내부 에러!');
	    }
	  });
	  client.on('end', function() {
	    console.log('Client disconnected');
	    server.getConnections(function(err, count){
	      console.log('Remaining Connections: ' + count);
	    });
	  });
	  client.on('error', function(err) {
	    console.log('Socket Error: ', JSON.stringify(err));
	  });
	  client.on('timeout', function() {
	    console.log('Socket Timed out');
	  });
	});
	server.listen(1006, function() {
	  console.log('Server listening: ' + JSON.stringify(server.address()));
	  server.on('close', function(){
	    console.log('Server Terminated');
	  });
	  server.on('error', function(err){
	    console.log('Server Error: ', JSON.stringify(err));
	  });
	});
	
	function writeData(socket, data){
		  var success = !socket.write(data);
		  if (!success){
		    (function(socket, data){
		      socket.once('drain', function(){
		        writeData(socket, data);
		      });
		    })(socket, data);
		  }
		}
	
	

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
	req.session.destroy();
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  req.session.destroy();
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
