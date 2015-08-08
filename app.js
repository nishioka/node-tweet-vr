'use strict';

var express = require('express');
var config = require('./config/config');
//var glob = require('glob');
//var mongoose = require('mongoose');

var http = require('http');

var Twit = require('twit');
var fs = require('fs');
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;

/*
mongoose.connect(config.db);
var db = mongoose.connection;
db.on('error', function () {
    throw new Error('unable to connect to database at ' + config.db);
});

var models = glob.sync(config.root + '/app/models/*.js');
models.forEach(function (model) {
    require(model);
});
*/

var app = express();

require('./config/express')(app, config);

var filename = __dirname + '/config.json';
var configTwitter;
try {
    var result = fs.readFileSync(filename);
    configTwitter = JSON.parse(result);
} catch (e) {
    console.log('Could not read config file ' + filename);
    console.log('env:', process.env);
    configTwitter = {
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET
    };
}
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
//require('./app/lib/share').io = io;

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

var getImageBase64 = function (url, callback) {
    // 1. Loading file from url:
    http.get(url, function (res) { // url is the url of a PNG image.
        var body = '';
        res.setEncoding('binary');

        res.on('data', function (chunk) {
            if (res.statusCode === 200) {
                body += chunk;
            }
        });

        res.on('end', function (res) { // 2. When loaded, do:
            //console.log("1:Loaded response >>> " + body); // print-check xhr response 
            var imgBase64 = new Buffer(body, 'binary').toString('base64'); // convert to base64
            callback(imgBase64); //execute callback function with data
        });
    }).on('error', function (e) {
        console.log(e.message); //エラー時
    });
};

passport.use(new TwitterStrategy({
    consumerKey: configTwitter.consumer_key,
    consumerSecret: configTwitter.consumer_secret,
    callbackURL: "/auth/twitter/callback"
}, function (token, tokenSecret, profile, done) {
    configTwitter.access_token = token;
    configTwitter.access_token_secret = tokenSecret;

    console.log('Successfully OAuth\n' + JSON.stringify(configTwitter, null, ' ') + '\n');
    console.log('profile', profile);

    require('./app/lib/share').configTwitter = configTwitter;

    var T = new Twit(configTwitter);

    //require('./app/lib/share').stream = T.stream('user', {
    var stream = T.stream('user', {
        track: profile.username
    });
    //var io = require('../lib/share').io;
    //var stream = require('../lib/share').stream;

    stream.on('tweet', function (tweet) {
        //if (typeof tweet.retweeted_status === 'undefined') {
        //    return;
        //}
        console.log(tweet.user.name + ':' + tweet.text);
        //SVG DOM injection
        getImageBase64(tweet.user.profile_image_url, function (encode) {
            //console.log('data:image/png;base64,' + encode); // replace link by data URI
            tweet.user.profile_image_url = 'data:image/png;base64,' + encode;
            io.sockets.emit('msg', tweet);
        });
    });
    stream.on('connect', function(request) {
        console.log('stream connection attempted.');
    });
    stream.on('connected', function (res) {
        console.log('stream connected (' + res.statusCode + ')');
    });
    stream.on('reconnect', function (req, res, interval) {
        console.log('stream reconnecting in ' + interval + ' (' + res.statusCode + ')');
    });


    return done(null, profile);
}));

module.exports = app;