/*
 * TheApp
 * 
 * The configuration file for each site, this class the application parameters
 *
 * 
 */

// EXPORT THE PARAMS THAT THE APP USES
module.exports = {

    //favicon: '/', // Path to favicon
    title: 'MuContent', // The application title used into views etc
    site_url: 'http://localhost:8000/',
    
    maintenance: false, // Set if the site is in maintenance mode
    maintenance_allowed: {}, // Set the allowed ip in this mode, like : {'127.0.0.1': true, ...}
    maintenance_message: "<center>We are online soon</center>",

};
