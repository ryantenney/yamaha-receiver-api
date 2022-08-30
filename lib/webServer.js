/*
	hosts REST APIs for Yamaha Receiver API
*/

var http = require('http');
var request = require('request-promise');
var express = require('express');
var log4js = require('log4js');
var ip = require('ip');
var cla = require('command-line-args');
var receiver = require('./yamaha-receiver.js');
const path = require('path');
const port=6969;
const deltaVolumeChange=10;

log4js.configure(
  {
    appenders: {
      dateFile: {
        type: 'dateFile',
        filename: path.join(__dirname,'../logs/web-service.log'),
        pattern: 'yyyy-MM-dd-hh',
        compress: true
      },
      out: {
        type: 'stdout'
      }
    },
    categories: {
      default: { appenders: ['dateFile', 'out'], level: 'trace' }
    }
  }
);


var app = express();
const logger = log4js.getLogger('webServer');
const claOptionDef = [
    { name : 'MAC', alias: 'M', type: String },
    { name : 'IP', type: String }
];

// parse the Command Line arguments using options definition
var cliArgs = cla(claOptionDef);

if(cliArgs.MAC){
	logger.debug("MAC supplied on CLI: "+cliArgs.MAC);
	receiver.init(cliArgs.MAC);
} else if(cliArgs.IP){
	logger.debug("IP supplied on CLI: "+cliArgs.IP);
	receiver.initIP(cliArgs.IP);
} else {
	// default
	receiver.initDefault();
}

function getPaths(){
	var paths = '';
	app._router.stack.forEach(function(r){
		if(r.route && r.route.path){
			var methods = [];
			for (var method in r.route.methods){
				if (method == 'all') {methods.push('ALL');}
			    methods.push(method.toUpperCase())
			}
			paths+=methods+'\t'+r.route.path+'\n';
		}
	});
	return paths;
};

// endpoints
app.get('/receiver/info', async function(req,res){
	var retVal = '';
	var status = 200;

	try{
		basicInfoResponse = await receiver.getBasicInfo();
		if(basicInfoResponse.status == 200){
			retVal = basicInfoResponse.basicInfo;
		}
	} catch(err) {
		msg = "There was an error:\n\t"+err.msg;
		logger.error(msg);
		retVal = {err: msg}
		status=500;
	}
	
	res.status(status).type('application/json').send(retVal);
});

app.get('/receiver/volume', async function(req,res){
	var retVal = {};
	var status = 200;

	try{
		volumeResponse = await receiver.getVolume();
		if(volumeResponse.status == 200){
			retVal = volumeResponse.volumeObj;
		}
	} catch(err) {
		msg = "There was an error:\n\t"+(err.msg || err);
		logger.error(msg);
		retVal = {err: msg}
		status=500;
	}
	
	res.status(status).type('application/json').send(retVal);
});

app.get('/receiver/power', async function(req,res){
	var retVal = '';
	var status = 200;

	try{
		powerResponse = await receiver.getPowerStatus();
		if(powerResponse.status == 200){
			retVal = powerResponse.powerObj;
		}
	} catch(err) {
		msg = "There was an error:\n\t"+err.msg;
		logger.error(msg);
		retVal = {err: msg}
		status=500;
	}
	
	res.status(status).type('application/json').send(retVal);
});

app.post('/receiver/powerOn', async function(req,res){
	var retVal = '';
	var status = 200;
	try{
		var turnPowerOnResp = await receiver.setPowerState('ON');
		status = turnPowerOnResp.status;
		retVal = {result:turnPowerOnResp.msg};
	} catch(err) {
		msg = "There was an error:\n\t"+err.msg;
		logger.error(msg);
		retVal = {err: msg};
		status=500;
	}
	
	res.status(status).type('application/json').send(retVal);
});

app.post('/receiver/powerOff', async function(req,res){
	var retVal = '';
	var status = 200;
	try{
		var turnPowerOffResp = await receiver.setPowerState('OFF');
		status = turnPowerOffResp.status;
		retVal = {result:turnPowerOffResp.msg};
	} catch(err) {
		msg = "There was an error:\n\t"+err.msg;
		logger.error(msg);
		retVal = {err: msg};
		status=500;
	}
	
	res.status(status).type('application/json').send(retVal);
});

app.all('*', function(req,res){
	res.status(200).type("text/plain").send("Paths Available\n\n"+getPaths());
});


app.listen(port);
logger.info("webServer listening on: "+ip.address()+":"+port);
