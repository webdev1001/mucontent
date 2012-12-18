/*
 * TheApp
 * 
 * The configuration file, this class the application parameters
 *
 * 
 */

// EXPORT THE PARAMS THAT THE APP USES
module.exports = {

    // DATABASE
    redis_host: '127.0.0.1', // the redis database host
    redis_port: 6379, // the redis database port
    mongodb_ip: '127.0.0.1', // the mongodb host
    mongodb_port: 27017, // the mongodb port
    db_name: 'thesite', // the database name in mongodb for the app

    // COOKIE AND SESSIONS
    cookie_secret: '0acbd5c92bd99ba02bad5bab985a26c5',
//    client_host: '0.0.0.0', // the client host
    client_host: '127.0.0.1', // the client host
    client_port: '8000', // the client port
	
    // Comment this options if you want http connection
    /*https_options: { //HTTPS Options
	private_key: __dirname + '/certs/privatekey.pem', // the HTTPS private key
	certificate: __dirname + '/certs/certificate.pem', // the HTTPS certificate
    },
*/

    //realtime: true, // If true, enable socket.io for realtime application
    //favicon: '/', // Path to favicon
    title: 'MuContent', // The application title used into views etc
    site_url: 'http://localhost:8000/',
    
    // SMTP Settings
    from: "MuContent <sender@mucontent.com>", // Define from address for mail
    allow_mail: false, // If treu allow the email sending
    // AMAZON AWS Credentials
    AWS_KEY: '',
    AWS_SECRET: '',

    // Static route name that are referred to view
    static_route: ['us'],
    
    routing_acl: [ // Set the acl for single route
        {route: '/logout', acl: {0: true, 1: true}},
        {route: '/messages', acl: {0: true, 1: true}},
        {route: '/messages/number', acl: {0: true, 1: true}, ajax: true}, // The ajax is a different request and restricted respond in a different way
        {route: '/messages/clear', acl: {0: true, 1: true}, ajax: true},
        {route: '/messages/text', acl: {0: true, 1: true}, ajax: true},
        // Put in route the same route defined in express.js, for example, a route with params:
        {route: '/objects/edit/:id', acl: {0: true, 1: true}, ajax: true},
        {route: '/objects/create', acl: {0: true, 1: true}, ajax: true}
    ], // Role legend: 0 (admin), 1 (user), add other if you want and modify the defaults
};
