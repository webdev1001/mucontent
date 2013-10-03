/*
 * MuContent
 *
 * Main Helpers
 *
 */

// Requirements
var fs = require('fs');
var drex = require('./drex');

// Read the locales json and create locales
var locales = {};
fs.readdir(__dirname + '/../sites', function (err, sites) {
    sites.forEach(function (site) {
        fs.readdir(__dirname + '/../sites/' + site + '/locales', function (err, files) {
            files.forEach(function (file) {
                // Use drex library to dynamic reload the locales
                drex.require(__dirname + '/../sites/' + site + '/locales/' + file, function(data) {
                        var lang = site + '_' + file.split('.')[0];                         
                        locales[lang] = data;
                });
            });
        
        });
    });

});

// Read the menu parameters json and create variable
var menu = {};
fs.readdir(__dirname + '/../sites', function (err, sites) {
    sites.forEach(function (site) {
        // Use drex library to dynamic reload the locales
        drex.require(__dirname + '/../sites/' + site + '/settings/menu.js', function(data) {                        
            menu[site] = data;
        });
    });

});

// Extend hbs with block to use private/public resourse for each view
var blocks = {};
 
function extend (name, context) {
    var block = blocks[name];
    if (!block) {
        block = blocks[name] = [];
    }

    block.push(context(this));
}

function block (name) {
    var val = (blocks[name] || []).join('\n');

    // clear the block
    blocks[name] = [];
    return val;
}

// HBS Helper for check role and permission and get back the content if user is allowed
// Pass the allowed as a comma separated string like: 0,1,...
// IMP: If only an user group is allowed, don't forget the comma es: 0, => Only admin can see object
// on vi
function checkRole (role, allowed, options) {
    // Check if the value type passed to view is create or edit 
    var temp = allowed.split(',');
    if (temp[role]) { 
        return options.fn(this);
    } else {
        return;
    }    
}

// HBS HELPER for multilang, lang is the req.session.language setted by user
function translate (keyword, lang, site) {
    var ref = site + '_' + (lang || 'en'); 
    // pick the right dictionary
    var local = locales[ref];
    // loop through all the key hierarchy (if any)
    var target = local;
    var default_ref = site + '_en';
    var default_dict = locales[default_ref];
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
}

// Helper used to find available language for the sites
function availableLanguage (site) {
    // Read the language files available
    var locales = fs.readdirSync(__dirname + '/../sites/' + site + '/locales');
    var html = '';
    // See all file and create the html
    for (var i = 0; i < locales.length; i++) {
        html += '<li><a href="/locales/' + locales[i].split('.')[0] + '">' + locales[i].split('.')[0] + '</a></li>';
    } 
    return html;
}

// Menu helper
function createMenu (lang, role, site) {
    var ref = site + '_' + (lang || 'en'); 
    // pick the right dictionary
    var local = locales[ref];
   
    var html = "";
    
    // Get the menu in params
    menu[site].menu.forEach(function (item) {
        var key = item.title;
        var acl = item.acl;
        // Check if the acl is setted, otherwhise all can access
        if (acl) {
            // Write the menu voice only if user role is allowed
            if (acl[role]) {
                html += '<li><a href="' + item.path + '">';
                if (item.icon) {
                    html += '<i class="' + item.icon + '"></i> ';
                }
                html += local[key] + '</a></li>'; 
            }
        } else {
            html += '<li><a href="' + item.path + '">';
            if (item.icon) {
                html += '<i class="' + item.icon + '"></i> ';
            }           
            html += local[key] + '</a></li>'; 
        }
    });
    return html;
}

exports.extend = extend;
exports.block = block;
exports.createMenu = createMenu;
exports.availableLanguage = availableLanguage;
exports.checkRole = checkRole;
exports.translate = translate;
