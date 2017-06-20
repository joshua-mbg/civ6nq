#!/bin/env node
//  OpenShift sample Node application
var path = require('path');
var webpack = require('webpack');
var express = require('express');
var config = require('./webpack.config');
var bodyParser = require('body-parser');
var app = express();
var compiler = webpack(config);
var openid = require('openid');
var xss = require('xss');
var fs = require('fs');
var addr = "http://civ6nq.com/"
var apiKey = 'E3FD132D76BAF9967E0A0C9BFA3C689D';

function getUserData(apiKey, id, callback){
    var http = require('http');
    var url = 'http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key='+apiKey+'&steamids=' + id;
    http.get(url, function(response) {
        // console.log("Got response: " + response.statusCode);
        var strres = "";
        response.on('data', function (chunk) {
            strres += chunk;
        });
        response.on('end', function() {
            callback(JSON.parse(strres).response.players[0]);
        });
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
    });  
}

const relyingParty = new openid.RelyingParty(
    addr + "api/verify",
    addr,
    true,
    true,
    []
);

/**
 *  Define the sample application.
 */
var SampleApp = function() {

    //  Scope.
    var self = this;


    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };


    /**
     *  Populate the cache.
     */
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = { 'index.html': '' };
        }

        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./index.html');
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function(key) { return self.zcache[key]; };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {
        self.routes = { };
        self.posts = { };
        self.routes['*.css'] = (req, res) => {
          res.sendFile('app' + req.url, {
            root: '/'
          });
        };

        self.routes['*api/auth/:gameid?/:steamid?'] = function(req, res) {
            relyingParty.returnUrl = addr + 'api/verify' + (req.params.gameid? '/' + req.params.gameid : '') + (req.params.steamid? '/' + req.params.steamid : '');
            relyingParty.authenticate('http://steamcommunity.com/openid', false, function(error, authURL) {
                    if (error) {
                      res.writeHead(200);
                      res.end('Authentication failed: ' + error.message);
                    } else if (!authURL) {
                      res.writeHead(200);
                      res.end('Authentication failed');
                    } else {
                        res.writeHead(302, { Location: authURL, 'Cache-Control': 'no-cache' });
                        res.end();
                    }
              });
        };
        
        self.routes['*api/verify/:gameid?/:steamid?'] = function(req, res) {
            relyingParty.verifyAssertion(req, function(err, result) {
                if(err){
                    // console.log(JSON.stringify(err));
                    res.end("Error.")
                } else if(!result || !result.authenticated){
                    res.end('Failed to authenticate user.');

                // my games
                } else if(!req.params.gameid) {
                    steamID = result.claimedIdentifier.replace('http://steamcommunity.com/openid/id/', '');
                    getUserData(apiKey, steamID, function(steamData){
                        res.writeHead(301, {Location: `/?steamid=${steamData.steamid}`,'Cache-Control': 'no-cache'});
                        res.end();
                    });
                } else {
                    // console.log(JSON.stringify(result));
                    steamID = result.claimedIdentifier.replace('http://steamcommunity.com/openid/id/', '');
                    getUserData(apiKey, steamID, function(steamData){
                        // console.log(JSON.stringify(steamData));

                        const playersJSON = fs.readFileSync('./src/players.json', 'utf8');
                        const playerData = JSON.parse(playersJSON);
                        const registered = playerData.players.filter(player => player.steamid == steamData.steamid);
                        const isHost = !playerData.players.filter(player => player.games.indexOf(req.params.gameid)+1).length;
                        const gamesJSON = fs.readFileSync('./src/games.json', 'utf8');
                        const gameData = JSON.parse(gamesJSON);
                        const thisGame = gameData.games.filter(game => game.id == req.params.gameid).pop();
                        let hash = `#${req.params.gameid}`;

                        // JOINING
                        if (!req.params.steamid) {
                            // REGISTERED
                            if (registered.length) {
                                if (registered[0].games.indexOf(req.params.gameid) === -1) {
                                    const id = playerData.players.indexOf(registered[0]);
                                    playerData.players[id].games.push(req.params.gameid);
                                    playerData.players[id].quitter.played.push(req.params.gameid);
                                    Object.assign(playerData.players[id], steamData);
                                    fs.writeFileSync('./src/players.json', JSON.stringify(playerData), 'utf8');
                                }

                            // NEW
                            } else {
                                steamData.quitter = {"played":[req.params.gameid],"quit":[]};
                                steamData.games = [req.params.gameid];
                                playerData.players.push(steamData);
                                fs.writeFileSync('./src/players.json', JSON.stringify(playerData), 'utf8');
                            }

                            if (isHost) {
                                gameData.games[gameData.games.indexOf(thisGame)].verified = parseInt(steamData.steamid);
                                fs.writeFileSync('./src/games.json', JSON.stringify(gameData), 'utf8');
                            }
                        // LEAVING
                        } else if (steamData.steamid == req.params.steamid) {
                            const gameDay = new Date(thisGame.day);
                                gameDay.setHours(0);
                                gameDay.setMinutes(0);
                                gameDay.setSeconds(0);
                            const isQuitter = new Date() >= gameDay;
                            let players = 0;
                            playerData.players.map(player => {
                                if (player.steamid == steamData.steamid) {
                                    player.games = player.games.filter(gameid => gameid != req.params.gameid);
                                    if (isQuitter && player.quitter.quit.indexOf(req.params.gameid) === -1) player.quitter.quit.push(req.params.gameid);
                                }
                                if (player.games.indexOf(req.params.gameid)+1) players++;
                                return player;
                            });
                            if (!players) {
                                gameData.games = gameData.games.filter(game => game.id != req.params.gameid);
                                fs.writeFileSync('./src/games.json', JSON.stringify(gameData), 'utf8');
                                hash = '';
                            }
                            fs.writeFileSync('./src/players.json', JSON.stringify(playerData), 'utf8');
                        }

                        res.writeHead(301, {Location: `/?steamid=${steamData.steamid}${hash}`, 'Cache-Control': 'no-cache'});
                        res.end();
                    });
                }
            });
        };

        self.routes['*api/games'] = function(req, res) {
            var data = fs.readFileSync('./src/games.json', 'utf8');
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-cache');
            res.end(data);
        };

        self.routes['*api/players'] = function(req, res) {
            var data = fs.readFileSync('./src/players.json', 'utf8');
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-cache');
            res.end(data);
        };

        self.routes['*'] = function(req, res) {
          res.sendFile(path.join(__dirname, 'index.html'));
        };

        self.posts['*api/create'] = function(req, res) {
            const data = fs.readFileSync('./src/games.json', 'utf8');
            const json = JSON.parse(data);

            json.games.push(req.body);
            json.games[json.games.length-1]['id'] = json.games[json.games.length-2]['id']+1;
            json.games[json.games.length-1]['verified'] = false;
            json.games[json.games.length-1]['description'] = xss(json.games[json.games.length-1]['description']);

            fs.writeFileSync('./src/games.json', JSON.stringify(json), 'utf8');

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-cache');
            res.end(JSON.stringify(json.games[json.games.length-1]));
        };
    };


    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.createRoutes();
        self.app = express();

        self.app.use(bodyParser.json()); // support json encoded bodies
        self.app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
        self.app.use(require('webpack-dev-middleware')(compiler, {
          publicPath: config.output.publicPath,
          stats: {
              colors: true,
              hash: false,
              version: false,
              timings: false,
              assets: false,
              chunks: false,
              modules: false,
              reasons: false,
              children: false,
              source: false,
              errors: true,
              errorDetails: true,
              warnings: true,
              publicPath: false
            }
        }));

        self.app.use(require('webpack-hot-middleware')(compiler));

        //  Add handlers for the app (from the routes).
        for (var r in self.routes) {
            self.app.get(r, self.routes[r]);
        }

        //  Add handlers for the app (from the routes).
        for (var r in self.posts) {
            self.app.post(r, self.posts[r]);
        }
    };


    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
        self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
    };

};   /*  Sample Application.  */



/**
 *  main():  Main code.
 */
var zapp = new SampleApp();
zapp.initialize();
zapp.start();

