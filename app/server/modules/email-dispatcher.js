
var EM = {};
module.exports = EM;

EM.server = require("emailjs/email").server.connect(
{
	host 	    : process.env.EMAIL_HOST || 'smtp.gmail.com',
	user 	    : process.env.EMAIL_USER || 'overmountains@gmail.com',
	password    : process.env.EMAIL_PASS || 'slickshoes3',
	ssl		    : true
});

EM.dispatchResetPasswordLink = function(account, callback)
{
	EM.server.send({
		from         : process.env.EMAIL_FROM || 'notchris <overmountains@gmail.com>',
		to           : account.email,
		subject      : 'notchris | Password Reset',
		text         : 'Reset your password...',
		attachment   : EM.composeEmail(account)
	}, callback );
}

EM.composeEmail = function(o)
{
	var link = 'http://notchris.net/reset-password?e='+o.email+'&p='+o.pass;
	var html = "<html><body>";
		html += "Hi "+o.name+",<br><br>";
		html += "Your username is <b>"+o.user+"</b><br><br>";
		html += "<a href='"+link+"'>Reset Password</a><br><br>";
		html += "<br>";
		html += "<a href='http://notchris.net/'>notchris</a><br><br>";
		html += "</body></html>";
	return  [{data:html, alternative:true}];
}