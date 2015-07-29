'use strict';

var express = require('express');
var config = require('./config/config');
var glob = require('glob');
var mongoose = require('mongoose');

var Twit = require('twit');
var fs = require('fs');
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;

mongoose.connect(config.db);
var db = mongoose.connection;
db.on('error', function () {
    throw new Error('unable to connect to database at ' + config.db);
});

var models = glob.sync(config.root + '/app/models/*.js');
models.forEach(function (model) {
    require(model);
});

var app = express();

require('./config/express')(app, config);

var filename = __dirname + '/config.json';
var result = fs.readFileSync(filename);
if (!result) {
    throw new Error('Couldn"t read config file ' + filename);
}
var configTwitter = JSON.parse(result);
console.log('Successfully read and parsed config file \n' + JSON.stringify(configTwitter, null, ' ') + '\n');

var server = app.listen(config.port);
var io = require('socket.io').listen(server);

/*
io.sockets.on('connection', function (socket) {
    socket.on('msg', function (data) {
        io.sockets.emit('msg', data);
    });
});
*/
require('./app/lib/share').io = io;

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

passport.use(new TwitterStrategy({
    consumerKey: configTwitter.consumer_key,
    consumerSecret: configTwitter.consumer_secret,
    callbackURL: "http://localhost:3000/auth/twitter/callback"
}, function (token, tokenSecret, profile, done) {
    configTwitter.access_token = token;
    configTwitter.access_token_secret = tokenSecret;

    console.log('Successfully OAuth\n' + JSON.stringify(configTwitter, null, ' ') + '\n');
    console.log('profile', profile);

    require('./app/lib/share').configTwitter = configTwitter;

    var T = new Twit(configTwitter);

    require('./app/lib/share').stream = T.stream('user', {
        track: profile.username
    });

    return done(null,profile);
}));

module.exports = app;