/*
 * TheApp
 * 
 * The configuration file, this class instance the Express settings 
 * and other application settings
 *
 * 
 */

// REQUIREMENTS
var express = require('express');
var expressValidator = require('express-validator');
var RedisStore = require('connect-redis')(express);
var utils = require('./lib/utils');
var hbs = require('hbs');
var sessionStore = new RedisStore();
var fs = require('fs');
// Require parameters class and instance it
var parameters = require('./params');

// Read the locales json and create locales
var locales = {};
fs.readdir(__dirname + '/locales', function (err, files) {
    files.forEach(function (file) {
        fs.readFile(__dirname + '/locales/' + file, 'utf8', function (err, data) {
            if (err) {
                utils.applog('error', 'Error with locales loading: ' + err);
            } else {
                var lang = file.split('.')[0]; 
                locales[lang] = JSON.parse(data);
            }
        });
    });
});


// Extend hbs with block to use private/public resourse for each view
var blocks = {};

hbs.registerHelper('extend', function(name, context) {
    var block = blocks[name];
    if (!block) {
        block = blocks[name] = [];
    }

    block.push(context(this));
});

hbs.registerHelper('block', function(name) {
    var val = (blocks[name] || []).join('\n');

    // clear the block
    blocks[name] = [];
    return val;
});

// HBS Helper for check type in user_form view and send right content
hbs.registerHelper('seeType', function(part) {
    // Check if the value type passed to view is create or edit
    if(this.type === "create") {
        // Get the code in the main block
        return part.fn(this);
    } else {
        // Get the code in the else block
        return part.inverse(this);
    }
});


// HBS helper to create a "global varialbe" that we can use on template to image path base url
hbs.registerHelper('s3bucket', function() {
    return 'https://s3.amazonaws.com/digitalgroundtest/';
});

// HBS Helper for check role and permission and get back the content if user is allowed
// Pass the allowed as a comma separated string like: 0,1,...
// IMP: If only an user group is allowed, don't forget the comma es: 0, => Only admin can see object
// on vi
hbs.registerHelper('checkRole', function(role, allowed, options) {
    // Check if the value type passed to view is create or edit 
    var temp = allowed.split(',');
    if (temp[role]) { 
        return options.fn(this);
    }
    

});

// HBS HELPER for multilang, lang is the req.session.language setted by user
hbs.registerHelper('l10n', function(keyword, lang) {
    // pick the right dictionary
    local = locales[lang] || locales['en'];
    // loop through all the key hierarchy (if any)
    var target = local;
    var default_dict = locales['en'];
    var keys = keyword.split(".");
    keys.forEach(function (key){
        if (target[key]) {
            target = target[key];
        } else {
            target = default_dict[key];
        }
     });
     //output
     return target;
});

// Define configuration class
var Config = function () {};

// EXPORT EXPRESS CONFIGURATION SETTINGS
Config.prototype.Application = function(app) {
    // Remove Express information from the response header
    app.use(function (req, res, next) {
	res.removeHeader("X-Powered-By");
        next();
    }); 

    // Set favicon if is enabled in configuration parameters
    if (parameters.favicon) {
        app.use(express.favicon(__dirname + parameters.favicon));
    }
		
    // Set view
    app.set('view engine', 'hbs');
    app.set('views', __dirname + '/views');     
    
    // Set cookie
    app.use(express.cookieParser(parameters.cookie_secret));
    
    app.use(express.session({
	cookie: {maxAge: 24 * 60 * 60 * 1000}, 
	// SET THE DB PARAMS TO SHARE SESSION ON SAME DATABASE
	store: new RedisStore({
            host: parameters.redis_host,
            port: parameters.redis_port
	}) 
	})
    );

   
    app.use(express.compress());
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    
    app.use(expressValidator);

   // Set static private file directory, use dedicated mounted path /static/private
   app.use('/static/private', function(req, res, next){
	// check athentication
	if(req.session.user){
            express.static(__dirname + '/private')(req, res, next);
	} else {
            utils.applog('error', "Request invalid file from not authorized address: " + req.connection.remoteAddress);
            next(); 
	}
    });
    // Set static public file directory, use dedicated mounted path /static/public
    app.use('/static/public', express.static(__dirname + '/public'));

    // Set the default locals
    app.use(function(req, res, next){
        res.locals.title = parameters.title;
        res.locals.site_url = parameters.site_url;
        res.locals.session = req.session;
        // This is used for flash messages on redirect, set the session variable, and if is set pass to locals
        if (req.session.flashMessage) {
            res.locals.message = req.session.flashMessage;
            req.session.flashMessage = false;
        } else {
            res.locals.message = false;        
        }
        next();
    });

    app.use(app.router);
    
    // Set error view if env is development
    if ('development' == process.env.NODE_ENV) {
	app.use(express.errorHandler());
    }
    // Set the error page if resource isn't found
    app.use(function(req, res){
	utils.applog('error', "Application page not found " + req.url);
	res.render('40x');
    });
    // Set page for application errors
    app.use(function(err, req, res, next){
	// if an error occurs Connect will pass it down
	// through these "error-handling" middleware
	// allowing you to respond however you like
	utils.applog('error', "Application error: " + err);
	res.render('50x');
    });


};

// DEFINE SOCKET.IO CONFIGURATION
Config.prototype.SocketIO = function (io) {
    io.configure(function() {
	// Limit log level
	io.set('log level', 1);
        // Set store in redis so allow scale
        var RedisStore = require('./node_modules/socket.io/lib/stores/redis'),
            redis=require('redis'),
            pub    = redis.createClient(),
            sub    = redis.createClient(),
            client = redis.createClient();
        
        io.set('store', new RedisStore({
          redisPub : pub
        , redisSub : sub
        , redisClient : client
        }));
	// Set authentication method
	io.set('authorization', function(data, callback) {
            if (data.headers.cookie) {
		data.cookie = utils.parseCookie(data.headers.cookie);
		//Get only a part of the hash (remove "s:" and the part after ".")
		// See: http://stackoverflow.com/questions/12217725/socket-io-cookie-parse-handshake-error
		data.sessionID = data.cookie['connect.sid'].split('.')[0].split(':')[1];
		sessionStore.get(data.sessionID, function(err, session) {
                    if (err || !session) {
                        utils.applog('error', "Realtime error: " +  err);
			callback('Error', false);
                    } else {
			data.session = session;
			callback(null, true);
                    }
		 });
            } else {
                utils.applog('error', "Realtime error: no cookie");
		callback('No cookie', false);
            }
	});
    });
};

module.exports = Config;
