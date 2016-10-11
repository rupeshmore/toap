/*

*/
'use strict';

const express = require('express');
const request = require('request').defaults({jar: true});
const url = require("url");
const config  = require('./config.json');
const bodyParser = require('body-parser');
const fs = require('fs');
const querystring = require('querystring');
const opn = require('opn');
const proxy = express();
const toap = express();
const toapPort = process.env.PORT || config.toapGuiPort || 3001;
//const cors = require('cors');
const port = process.env.PORT || config.toapProxyPort || 3010;
const readable = require('stream').Readable;

// following variables and modules handle multipart file upload for request module.
const multipartFileStorage = __dirname + '/uploads';
const multer = require('multer');
const upload = multer({ dest: multipartFileStorage });
// module to remove uploaded multipart files.
const findRemoveSync = require('find-remove');

const recordHeaderCookie = config.recordHeaderCookie || false;

let thinkStartTime, thinkEndTime;
let firstTimeWrite = true;

// write to file
let file;

/*
  Parse the url
*/
let urlParser;
let slashes;
let origin;
let urlPath;

/*
  recording variables
*/
let recordThinkTime;
let recordHeaders;

/*
  check if folder exists, else create folder flow in current directory
*/
let flowFolder = config.flowFolder || './flow';
checkDirectorySync(flowFolder);

/*
  delete all files older than one hour for multer - 3600 seconds
*/
setInterval(function(){
    findRemoveSync(multipartFileStorage, {age: {seconds: 3600}});
}, 3600);

/*
    serving static files for toap gui.
*/
toap
  .use(express.static(__dirname))
  .use(bodyParser.urlencoded({ extended: true }))
  .use(bodyParser.json())
  .listen(toapPort);

console.log('Toap - GUI running on port ' + toapPort + '!');


let browser = config.browser || 'chrome'; // default to chrome browser
if (browser ==='chrome') {
	if (process.platform === 'darwin') {
		browser = 'google chrome';
	} else if (process.platform === 'linux') {
		browser = 'google-chrome';
	}
}
opn('http://localhost:'+ toapPort, {app: [browser]});


/*
	Toap Express server requests
*/
let server;

toap.post('/startToap', function (req, res) {
  thinkStartTime = undefined;
  if(typeof req.body.recordThinkTime === 'string') {
    req.body.recordThinkTime = JSON.parse(req.body.recordThinkTime);
  }

  if(typeof req.body.recordHeaders === 'string') {
    req.body.recordHeaders = JSON.parse(req.body.recordHeaders);
  }

  if (req.body.urlToRecord) {
    urlParser = url.parse(req.body.urlToRecord);
    slashes = urlParser.slashes ? '//' : '';
    origin = urlParser.protocol + slashes + urlParser.host;
    urlPath = urlParser.path;
    if(urlParser.hash) urlPath = urlPath + urlParser.hash;
  }

  recordThinkTime = req.body.recordThinkTime;
  recordHeaders = req.body.recordHeaders;

  if (req.body.fileName) {
    file = flowFolder + '/' + req.body.fileName + '.json';
  }

  if (!server) {
    server = proxy.listen(port);
    console.log('Toap - artillery.io http(s) recorder running on port ' + port + '!');
    res.status(200).send({url: 'http://localhost:' + port + urlPath});
  } else {
    res.status(409).send({error: 'Toap proxy server already in use.'});
  }

});

toap.post('/stopToap', function (req, res) {
  if (server) {
    server.close();
    console.log('Toap - artillery.io http(s) recorder stopped !');
    server = null;
    res.status(200).send('Toap proxy stopped');
  }
});

toap.post('/addComments', function (req, res) {
  if (req.body && req.body.comments) {
    //let comments = {comments: req.body.comments};
    let comments = '{\n/*'+req.body.comments+'*/\n}';
    writeToFile(comments);
  }
});

toap.get('/getToapProxyStatus', function (req, res) {
  if (server) {
    res.status(200).send({status: 'UP'});
  } else {
    res.status(200).send({status: 'DOWN', error: 'Toap proxy server is down.'});
  }
});


/*
  Configure proxy server to use body parser for request body
*/
proxy.use(bodyParser.urlencoded({ extended: true }));
proxy.disable('Content-Security-Policy');

/*
  proxy all request
*/
proxy.use('*', upload.any(), function(req, res) {
  // set headers for cors
  if (req.headers.origin) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  //TODO set headers for Content-Security-Policy.
  //res.setHeader('Content-Security-Policy', "default-src http 'unsafe-inline' 'unsafe-eval'");

	let method = req.method.toLowerCase();

	//call calculateThinkTime to calculate pause between request.
	if (recordThinkTime) calculateThinkTime();

  // call createFlow function to generate the flow from request
  createFlow(method, req.originalUrl, req.body, req.headers);

  let reqOptions = {
    url: origin + req.originalUrl
  };

	if (method === 'get') {
    //req.pipe(request(origin + req.originalUrl)).pipe(res);
    req.pipe(request[method](reqOptions)).pipe(res);
	} else {
    // if method is delete trim to del to handle by request module.
		if (method === 'delete') {
      method = 'del';
		}

		if ("content-type" in req.headers && req.headers['content-type'].includes('multipart/form-data')) {
        let filesArray=[];

        for (let i = 0; i < req.files.length; i++) {
          filesArray.push(fs.createReadStream(req.files[i].path));
        }
        let formData = {
          attachments: filesArray
        };

        //request[method]({url: origin + req.originalUrl, formData: formData}).pipe(res);
        reqOptions.formData = formData;

      } else if ('content-type' in req.headers &&  req.headers['content-type'].includes('application/x-www-form-urlencoded')) {

        //request[method]({url: origin + req.originalUrl, form: req.body}).pipe(res);
        reqOptions.form = req.body;

      } else if ('content-type' in req.headers && req.headers['content-type'].includes('application/json')) {
        reqOptions.json = req.body;
        //request[method]({url: origin + req.originalUrl, json: req.body}).pipe(res);
      }
      request[method](reqOptions).pipe(res);
    }
});

function createFlow(method, requestUrl, body, headers){
  let flowJson = {};
	let httpMethod = method;

  flowJson[httpMethod] = {};

	flowJson[httpMethod].url = requestUrl;
	if (recordHeaders) {
    if (!recordHeaderCookie) {
      delete headers.cookie; //delete cookie information
    }
    //loop through the headers values and replace the hostname
    for (let key in headers) {
        if (Object.prototype.hasOwnProperty.call(headers, key)) {
            let val = headers[key];
            let regex = new RegExp("localhost:" + port, "g");
            val = val.replace(regex, urlParser.host);
            headers[key] = val;
        }
    }
		flowJson[httpMethod].headers = headers;
  }

  if ('content-type' in headers && headers['content-type'].includes('application/x-www-form-urlencoded')) {
    flowJson[httpMethod].body = querystring.stringify(body);
  } else if ('content-type' in headers && headers['content-type'].includes('application/json')) {
    flowJson[httpMethod].json = body;
  } else if ('content-type' in headers && headers['content-type'].includes('multipart/form-data')) {
    writeToFile('\n/*Comment: this is an upload ' + httpMethod + ' request. No body is recorded.*/\n');
    //flowJson[httpMethod].body = {};
    flowJson[httpMethod].body = body;
  }

	writeToFile(flowJson);
}

function writeToFile(object) {
  if (typeof object === 'object') {
    object = JSON.stringify(object, null, 1);
  }
  if (firstTimeWrite) {
    firstTimeWrite = false;
  } else {
    object = ',' + object;
  }

  // using stream to write to file
  let ws = fs.createWriteStream(file, {'flags': 'a+'});
  let rs = new readable;
  rs.push(object);
  rs.push(null);
  rs.pipe(ws);
}

function calculateThinkTime() {
	if (thinkStartTime !== undefined) {
		thinkEndTime = Date.now();
		let thinkTime = Math.round((thinkEndTime - thinkStartTime)/1000);

		// write to json if thinktime is greater than 1 second
		if (thinkTime > 1) {
			writeToFile({think:thinkTime});
		}
	}
	thinkStartTime = Date.now();
}


function checkDirectorySync(directory) {
  try {
    fs.statSync(directory);
  } catch(e) {
    fs.mkdirSync(directory);
  }
}

function isDirSync(aPath) {
  try {
    return fs.statSync(aPath).isDirectory();
  } catch (e) {
    if (e.code === 'ENOENT') {
      return false;
    } else {
      throw e;
    }
  }
}
