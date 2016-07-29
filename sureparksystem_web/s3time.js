var express = require('express');
var path = require('path');
var moment = require('moment');

var s3time = express();

s3time.splitd = function (x){
	var now = moment().format('DD');
	return now;
};

s3time.splith = function (x){
	var now = moment().format('HH');
	return now;
};

s3time.splitm = function (x){
	var now = moment().format('mm');
	return now;
};

module.exports = s3time;
