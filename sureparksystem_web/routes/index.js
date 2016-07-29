var express = require('express');
var router = express.Router();
var session = require('express-session');
var mysql = require('mysql');
var s3time = require('../s3time.js');
var net = require('net');
var moment = require('moment');

var con = mysql.createConnection({
	host : 'localhost',
	user : 'root',
	password : 'g0t9d2e2',
	database : 'central'
});

/*
var htobeat = net.createServer(function(client) {
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
	    console.log('Local server dead.');
	  });
	});
	htobeat.listen(1818, function() {
	  console.log('Server listening: ' + JSON.stringify(htobeat.address()));
	  htobeat.on('close', function(){
	    console.log('Server Terminated');
	  });
	  htobeat.on('error', function(err){
	    console.log('Server Error: ', JSON.stringify(err));
	  });
	});
*/

router.use(session({
	secret : 'surepark',
	resave : false,
	saveUninitialized : true,
}));

/* GET home page. */
router.get('/', function(req, res, next) {
	if (req.session.logined && req.session.auth === 2) {
		con.query('SELECT * FROM member', function(err, result, fields) {
			if(result[0] === undefined){
				var resultsm = result;
				var resultsp
				con.query('SELECT * FROM parking_lot_branch', function(err, result, fields) {
					if(result[0] === undefined){
						resultp = result;
						res.render('admin', {
							session : req.session,
							results1 : resultm,
							results2 : resultp
						});
					}else{
						
					}
				});
			}else{
				console.log('ERROR memeber list');
			}
		});
	} else if(req.session.logined && req.session.auth === 1){
		res.render('business', {
			session : req.session
		});
	} else if(req.session.logined && req.session.auth === 0){
		con.query('SELECT * FROM reservation where USER_ID = ? and RESERVE_STATE <> ? order by RESERVATION_DATE DESC',
				[req.session.user_id,1], function(err, result, fields) {
					if (!err) {
						res.render('main', {
							results : result,
							session : req.session
						});

					} else {
						console.log('ERROR');
					}
			});
	} else {
		res.render('login', {
			session : req.session
		});
	}
});

router.post('/login', function(req, res, next) {
	var userid = req.body.id;
	var pass = req.body.pw;

	con.query('SELECT * FROM member where USER_ID=?',userid,function(
			err, result, fields) {
		if(result[0] === undefined){
			res.send('<script>alert("You have wrong ID or PW");history.back();</script>');
		}else if (result[0].PASSWORD === pass) {
				req.session.auth = result[0].AUTH;
				req.session.user_name = result[0].USER_NAME;
				req.session.logined = true;
				req.session.user_id = req.body.id;
				res.redirect('/');
		} else {
			res.send('<script>alert("You have wrong ID or PW");history.back();</script>');
		}
	});
});

router.get('/logout', function(req,res,next){
	  req.session.destroy();
	  res.redirect('/');
});

router.get('/signup', function(req,res,next){
	  res.render('signup');
});

router.post('/branchreg', function(req,res,next){
	  res.render('branchreg');
});

router.post('/insertuser', function(req,res,next){
	var user_id = req.body.USER_ID;
	var user_name = req.body.USER_NAME;
	var password = req.body.PASSWORD;
	var user_phone = req.body.USER_PHONE;
	var user_email = req.body.email;
	var car_num = req.body.car_num;
	var certifi_id = req.body.certifi_id;
	var data = {USER_ID:user_id,USER_NAME:user_name,PASSWORD:password,USER_PHONE:user_phone,USER_EMAIL:user_email,CAR_NUM:car_num,CERTIFICATION_ID:certifi_id};

	con.query('INSERT INTO member SET ?',data ,function(err, result, fields) {
		if (!err) {
			res.redirect('/');
		} else {
			console.log('ERROR');
			res.send('<script>alert("Insert Error!");history.back();</script>');
		}
	});
});

router.post('/insertbranch', function(req,res,next){
	var branch_id = req.body.branch_id;
	var ip_addr = req.body.ip_addr;
	var nopl = req.body.nopl;
	var branch_name = req.body.branch_name;
	var branch_addr = req.body.branch_addr;
	var ef = req.body.ef;
	var data = {BRANCH_ID:branch_id,IP_ADDR:ip_addr,NUMBER_OF_PARKING_LOT:nopl,BRANCH_NAME:branch_name,BRANCH_ADDR:branch_addr,EXTERNAL_FACILITY:ef};

	con.query('INSERT INTO parking_lot_branch SET ?',data ,function(err, result, fields) {
		if (!err) {
			res.redirect('/');
		} else {
			console.log('ERROR');
			res.send('<script>alert("Insert Error!");history.back();</script>');
		}
	});
});

router.get('/reservation', function(req, res, next) {
	if(req.session.logined){
	  var day = s3time.splitd();
	  var hour = s3time.splith();
	  var min = s3time.splitm();
		con.query('SELECT * FROM parking_lot_branch', function(
				err, result, fields) {
			if (!err) {
				  res.render('userres', { day:day, hour:hour, min:min, session : req.session, results : result});
			} else {
				console.log('ERROR');
				res.redirect('/');
			}
		});
	}else{
		res.redirect('/');
	}
	});

router.post('/socproc', function(req,res,next){
	
	var user_id = req.session.user_id;
	var data = {USER_ID:user_id};
	var year = moment().format('YYYY');
	var month = moment().format('MM');
	var day = moment().format('DD');
	var hour = req.body.sel1;
	var min = req.body.sel2;
	var sec = '00';
	
	var send = user_id +" "+ year+"-"+month+"-"+day +" "+ hour+":"+min+":"+sec; 
	/*  
	var localconn = socket.getConnection('central','192.168.1.138');
	  localconn.write(1004,'aaaaaaaaaaaaaa');
	  localconn.on('error', function(err){
		  console.log("connect error");
	  });
	  */
	  console.log(send);
	  
	  //send='phswow77 2016-07-26 18:00:00'; 
	  var client = net.connect(1000,'192.168.1.136').setTimeout(5000);
	  client.on('error',function(err){
		  res.send('<script>alert("Parking lot have a problem! Try again.");history.back();</script>');
		  console.log('connection error');
	  });
	  client.on('data', function(data){
		  console.log('Server From : ' + data);
		  data = data.toString().split(" ");
		  console.log(data);
		  if(data[0] === '1'){
			con.query('INSERT INTO reservation SET RESERVATION_CODE=?, USER_ID=?, RESERVATION_DATE=NOW(), RESERVATION_START_TIME=NOW()', [data[2] ,req.session.user_id],function(err, result, fields) {
				res.send('<script>alert("Reservation sucess.");location.replace("/");</script>');
			});
		  }else{
			  res.send('<script>alert("Reservation failed. Try again.");location.replace("/");</script>');
		  }
	  });
	  client.on('end', function() {
		  console.log('Client disconnected');
	  });
	  client.write(send, 'utf8');
	  client.end();
});

module.exports = router;
