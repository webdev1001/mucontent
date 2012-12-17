/*
 * TheApp
 * 
 * The Login controller
 * 
 */
 
// Requirements
var utils = require('../lib/utils');
var parameters = require('../params');
var Model = require('../models/base');

/*
 *  The route function
 * 	Get as parameter the application instanced in app.js
 * 
 */
 
function route (app) { 
  	
    // Set index route
    app.get('/', utils.accesslog, function(req, res){
        res.render('index'); 
    });    
        
    // Language choose route    
    app.get('/locales/:choosed_lang', function (req, res) {
        req.session.language = req.params.choosed_lang;
        res.redirect('back');
     });

    // The static page routing
    app.get('/:static', utils.accesslog, function (req, res, next) {
        var size = parameters.static_route.length, count = 0;
        parameters.static_route.forEach(function (item) {
            if (req.params.static === item) {
                res.render(req.params.static);
                return; // Retrun to stop the forEach
            }
            // Count the route and, if the array complete the for, call next() 
            count += 1;
            if (count == size) {
                next();
            }
        });
    });
}

exports.route = route;
