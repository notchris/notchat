
/** notchat v1 **/

var http = require('http');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');
var cookieParser = require('cookie-parser');
var MongoStore = require('connect-mongo')(session);
var moment = require('moment');

var crypto 		= require('crypto');
var MongoDB 	= require('mongodb').Db;
var MongoServer	= require('mongodb').Server;


var app = express();

app.locals.pretty = true;
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/app/server/views');
app.set('view engine', 'jade');
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require('stylus').middleware({ src: __dirname + '/app/public' }));
app.use(express.static(__dirname + '/app/public'));

// build mongo database connection url //

var dbHost = process.env.DB_HOST || 'localhost'
var dbPort = process.env.DB_PORT || 27017;
var dbName = process.env.DB_NAME || 'notchris';

var dbURL = 'mongodb://'+dbHost+':'+dbPort+'/'+dbName;
if (app.get('env') == 'live'){
	dbURL = 'mongodb://'+process.env.DB_USER+':'+process.env.DB_PASS+'@'+dbHost+':'+dbPort+'/'+dbName;
}

var db = new MongoDB(dbName, new MongoServer(dbHost, dbPort, {auto_reconnect: true}), {w: 1});
db.open(function(e, d){
	if (e) {
		console.log(e);
	} else {
		if (process.env.NODE_ENV == 'live') {
			db.authenticate(process.env.DB_USER, process.env.DB_PASS, function(e, res) {
				if (e) {
					console.log('mongo :: error: not authenticated', e);
				}
				else {
					console.log('mongo :: authenticated and connected to database :: "'+dbName+'"');
				}
			});
		}	else{
			console.log('mongo :: connected to database :: "'+dbName+'"');
		}
	}
});

var sessionMiddleware = session({
	secret: 'faeb4453e5d14fe6f6d04637f78077c76c73d1b4',
	proxy: true,
	resave: true,
	saveUninitialized: true,
	store: new MongoStore({ url: dbURL })
	});

app.use(sessionMiddleware);

require('./app/server/routes')(app);

var server = http.createServer(app);
var io = require('socket.io')(server)

io.use(function(socket, next) {
    var req = socket.handshake;
    var res = {};
    sessionMiddleware(req, res, next);
});

// define online users and available rooms
var usernames = [];
var rooms = [];

// initial join
io.on('connection', function (socket) {

	if (socket.handshake.session.user){

	var roomList = db.collection('rooms');

	roomList.find().toArray(
	function(e, results) {
		rooms = results;
		socket.emit('rooms', rooms);
	});


	var joined = [];


	usernames.push({
		'user': socket.handshake.session.user.user,
		'country': socket.handshake.session.user.country
	})
	
	socket.on('init', function(){
		socket.username = socket.handshake.session.user.user;
		var time = moment().format('h:mm A')
		socket.emit('updateusers', usernames);
	});

	
	socket.on('message', function (roomid,data,color) {
		var time = moment().format('h:mm A')
		console.log(roomid,data,color,time)
		socket.emit('chat', roomid, socket.username, data, time, color);
	});
	
	socket.on('joinRoom', function(roomid){
		var time = moment().format('h:mm A')
			socket.emit('updaterooms',roomid);	
			socket.join(roomid);
			socket.broadcast.to(roomid).emit('message', roomid, socket.username+' has joined the room.');

			socket.emit('chat',roomid,'',socket.username+' has joined the room.',time);
	});

	socket.on('leaveRoom', function(roomid){
			var time = moment().format('h:mm A')
			socket.leave(roomid);
			socket.broadcast.to(roomid).emit('message', roomid, socket.username+' has left the room.');
	});
	
	socket.on('disconnect', function(){

		for (var i = 0, len = usernames.length; i < len; i++) {
		  if (usernames[i].user === socket.username){
		  	usernames.splice(usernames[i].user, 1);
		  }
		}

		socket.emit('updateusers', usernames);
		var time = moment().format('h:mm A')
		for (var i = 0, len = rooms.length; i < len; i++) {
			socket.leave(rooms[i]._id);
		}

	});
	}
});

server.listen(3000);