var path = require('path');
global.appRoot = path.resolve(__dirname);

const http = require('http');
const https = require('https');

var express = require('express');
var app = express();
var path = require('path');


var session = require('express-session');
var redisStore = require('connect-redis')(session);
var bodyParser = require('body-parser');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

var http_server = http.Server(app);
var https_server = https.createServer(app);

http_server.listen(80);
https_server.listen(443);

const redisAdapter = require('socket.io-redis');

var io = require('socket.io').listen(http_server);
io.adapter(redisAdapter({ host: 'localhost', port: 6379 }));
io.on('connection', function(socket){});

var controllers = require("./controllers");
controllers.set(app);
