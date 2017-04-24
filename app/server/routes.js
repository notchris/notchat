
var CT = require('./modules/country-list');
var AM = require('./modules/account-manager');
var RM = require('./modules/room-manager');
var EM = require('./modules/email-dispatcher');
var multipart = require('connect-multiparty');
var fs = require('fs');


module.exports = function(app) {


// main login page //
	app.get('/login', function(req, res){
	// check if the user's credentials are saved in a cookie //
		if (req.cookies.user == undefined || req.cookies.pass == undefined){
			res.render('login', { title: 'notchris' });
		}	else{
	// attempt automatic login //
			AM.autoLogin(req.cookies.user, req.cookies.pass, function(o){
				if (o != null){
				    req.session.user = o;
					res.redirect('/home');
				}	else{
					res.render('login', { title: 'notchris | Login' });
				}
			});
		}
	});
	
	app.post('/login', function(req, res){
		AM.manualLogin(req.body['user'], req.body['pass'], function(e, o){
			if (!o){
				res.status(400).send(e);
			}	else{
				req.session.user = o;
				if (req.body['remember-me'] == 'true'){
					res.cookie('user', o.user, { maxAge: 900000 });
					res.cookie('pass', o.pass, { maxAge: 900000 });
				}
				res.status(200).send(o);
			}
		});
	});

	
// logged-in user homepage //
	
	app.get('/', function(req, res) {
		if (req.session.user == null){
			res.redirect('/login');
		}
		else {
		RM.getAllRooms( function(e, rooms){
			res.render('home', {
				title : 'notchris | Home',
				countries : CT,
				udata : req.session.user,
				rdata : rooms
			});
		});
		}
	});

	app.get('/users/:user', function(req, res) {

		if (req.session.user == null){
			res.send('Connection error');
		}	else{
			AM.getAllRecords( function(e, accounts){
				for (var i = 0; i < accounts.length; i++) {
					if (accounts[i].user === req.params.user){
						res.send({
							user : accounts[i].user,
							name : accounts[i].name,
							country : accounts[i].country,
							photo: '/uploads/fullsize/'+accounts[i].user+'.jpg'
						})
					} else{
						res.send('User not found');
					}
				}
			})
		}
	});

	/*app.get('/users/:user', function(req, res) {

		if (req.session.user == null){
			res.redirect('/login');
		}	else{
			AM.getAllRecords( function(e, accounts){
				res.render('profile', {
					title : 'notchris | Users | ' + req.params.user,
					countries : CT,
					udata : req.session.user,
					accts : accounts,
					acct : req.params.user
				});
			})
		}
	});*/

	

	app.get('/settings', function(req, res) {
		if (req.session.user == null){
			res.redirect('/login');
		}	else{
			res.render('settings', {
				title : 'notchris | Settings',
				countries : CT,
				udata : req.session.user
			});
		}
	});

	app.post('/settings', function(req, res){
		if (req.session.user == null){
			res.redirect('/login');
		}	else{
			AM.updateAccount({
				id		: req.session.user._id,
				name	: req.body['name'],
				email	: req.body['email'],
				pass	: req.body['pass'],
				country	: req.body['country']
			}, function(e, o){
				if (e){
					res.status(400).send('error-updating-account');
				}	else{
					req.session.user = o;
			// update the user's login cookies if they exists //
					if (req.cookies.user != undefined && req.cookies.pass != undefined){
						res.cookie('user', o.user, { maxAge: 900000 });
						res.cookie('pass', o.pass, { maxAge: 900000 });	
					}
					res.status(200).send('ok');
				}
			});
		}
	});

	// room settings

	app.get('/room/settings', function(req, res) {
		if (req.session.user == null){
			res.redirect('/login');
		}	else{
			RM.getAllRooms( function(e, rooms){
				for (var i = 0; i < rooms.length; i++) {
					if (rooms[i].admin === req.session.user.user){
						res.render('roomsettings', {
							title : 'notchris | Room Settings',
							udata : req.session.user,
							rdata : rooms[i]
						});			
					}
				}	
			})
		}
	});

	app.post('/room/settings', function(req, res){
		if (req.session.user == null){
			res.redirect('/login');
		}	else{
			RM.updateRoom({
				admin	: req.session.user.user,
				name	: req.body['name'],
				desc	: req.body['desc'],
				type	: req.body['type']
			}, function(e, o){
				if (e){
					res.status(400).send('error-updating-room');
				}	else{
					res.redirect("/room/settings/");
				}
			});
		}
	});

	// photo upload

	app.post('/upload', multipart(),function(req, res) {
	  fs.readFile(req.files.image.path, function (err, data) {
	    var imageName = req.files.image.name
	    // If there's an error
	    if(!imageName){
	      console.log("There was an error")
	      res.redirect("/");
	      res.end();
	    } else {
	      var newPath = __dirname + "/uploads/fullsize/" + req.session.user.user + '.jpg';
	      // write file to uploads/fullsize folder
	      fs.writeFile(newPath, data, function (err) {
	        // let's see it
	        res.redirect("/settings/");
	      });
	    }
	  });
	});

	/// Show files
	app.get('/uploads/fullsize/:file', function (req, res){
	  file = req.params.file;
	  var img = fs.readFileSync(__dirname + "/uploads/fullsize/" + file);
	  res.writeHead(200, {'Content-Type': 'image/jpg' });
	  res.end(img, 'binary');
	});

	app.post('/logout', function(req, res){
		res.clearCookie('user');
		res.clearCookie('pass');
		req.session.destroy(function(e){ res.status(200).send('ok'); });
	})
	
// creating new accounts //
	
	app.get('/register', function(req, res) {
		res.render('signup', {  title: 'Register', countries : CT });
	});
	
	app.post('/register', function(req, res){
		AM.addNewAccount({
			name 	: req.body['name'],
			email 	: req.body['email'],
			user 	: req.body['user'],
			pass	: req.body['pass'],
			country : req.body['country']
		}, function(e){
			if (e){
				res.status(400).send(e);
			}	else{
				res.status(200).send('ok');
			}
		});
	});

// creating new rooms //
	
	app.get('/rooms/create', function(req, res) {
		if (req.session.user == null){
			res.redirect('/login');
		}	else{
			res.render('newroom', {
				title: 'Create Room',
				udata : req.session.user
			});
		}
	});
	
	app.post('/rooms/create', function(req, res){
		if (req.session.user == null){
			res.redirect('/login');
		}	else{
			RM.addNewRoom({
				admin   : req.session.user.user,
				name 	: req.body['name'],
				desc 	: req.body['desc'],
				type 	: req.body['type']
			}, function(e){
				if (e){
					res.status(400).send(e);
				}	else{
					res.status(200).send('ok');
				}
			});
		}
	});

// password reset //

	app.post('/lost-password', function(req, res){
	// look up the user's account via their email //
		AM.getAccountByEmail(req.body['email'], function(o){
			if (o){
				EM.dispatchResetPasswordLink(o, function(e, m){
				// this callback takes a moment to return //
				// TODO add an ajax loader to give user feedback //
					if (!e){
						res.status(200).send('ok');
					}	else{
						for (k in e) console.log('ERROR : ', k, e[k]);
						res.status(400).send('unable to dispatch password reset');
					}
				});
			}	else{
				res.status(400).send('email-not-found');
			}
		});
	});

	app.get('/reset-password', function(req, res) {
		var email = req.query["e"];
		var passH = req.query["p"];
		AM.validateResetLink(email, passH, function(e){
			if (e != 'ok'){
				res.redirect('/');
			} else{
	// save the user's email in a session instead of sending to the client //
				req.session.reset = { email:email, passHash:passH };
				res.render('reset', { title : 'Reset Password' });
			}
		})
	});
	
	app.post('/reset-password', function(req, res) {
		var nPass = req.body['pass'];
	// retrieve the user's email from the session to lookup their account and reset password //
		var email = req.session.reset.email;
	// destory the session immediately after retrieving the stored email //
		req.session.destroy();
		AM.updatePassword(email, nPass, function(e, o){
			if (o){
				res.status(200).send('ok');
			}	else{
				res.status(400).send('unable to update password');
			}
		})
	});
	
// view & delete accounts //
	
	app.get('/users', function(req, res) {
		if (req.session.user == null){
			res.redirect('/login');
		}	else{
			AM.getAllRecords( function(e, accounts){
				res.render('users', { title : 'notchris | Users', accts : accounts, udata : req.session.user });
			})
		}
	});
	
	app.post('/delete', function(req, res){
		AM.deleteAccount(req.body.id, function(e, obj){
			if (!e){
				res.clearCookie('user');
				res.clearCookie('pass');
				req.session.destroy(function(e){ res.status(200).send('ok'); });
			}	else{
				res.status(400).send('record not found');
			}
	    });
	});
	
	app.get('/reset', function(req, res) {
		AM.delAllRecords(function(){
			res.redirect('/print');	
		});
	});
	
	app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });

};
