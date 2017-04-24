
var crypto 		= require('crypto');
var MongoDB 	= require('mongodb').Db;
var Server 		= require('mongodb').Server;
var moment 		= require('moment');

/*
	Connect to Database
*/

var dbName = process.env.DB_NAME || 'notchris';
var dbHost = process.env.DB_HOST || 'localhost'
var dbPort = process.env.DB_PORT || 27017;

var db = new MongoDB(dbName, new Server(dbHost, dbPort, {auto_reconnect: true}), {w: 1});
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

var rooms = db.collection('rooms');

/* Room Management */

exports.getAllRooms = function(callback)
{
	rooms.find().toArray(
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
}

exports.addNewRoom = function(newData, callback)
{
	rooms.findOne({name:newData.name}, function(e, o) {
		if (o){
			callback('roomname-taken');
		}	else{
			newData.date = moment().format('MMMM Do YYYY, h:mm:ss a');
			rooms.insert(newData, {safe: true}, callback);
		}
	});
}

exports.updateRoom = function(newData, callback)
{
	rooms.findOne({admin:newData.admin}, function(e, o){
		o.name 	= newData.name;
		o.desc 	= newData.desc;
		o.type 	= newData.type;

		rooms.save(o, {safe: true}, function(e) {
			if (e) callback(e);
			else callback(null, o);
		});
	});
}

var getObjectId = function(id)
{
	return new require('mongodb').ObjectID(id);
}


