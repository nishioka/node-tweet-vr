/* global require:false, __dirname:false */

var express = require('express');
var config = require('./config/config');
var glob = require('glob');
var mongoose = require('mongoose');
var fs = require("fs");
var http = require('http');
var Twit = require('twit');
var util = require('util');

mongoose.connect(config.db);
var db = mongoose.connection;
db.on('error', function() {
    throw new Error('unable to connect to database at ' + config.db);
});

var models = glob.sync(config.root + '/app/models/*.js');
models.forEach(function(model) {
    require(model);
});

var app = express();

require('./config/express')(app, config);

var server = app.listen(config.port);

var io = require('socket.io').listen(server);
io.sockets.on('connection', function(socket) {
    socket.on('msg', function(data) {
        io.sockets.emit('msg', data);
    });
});

var Tweet = mongoose.model('Tweet');
var User = mongoose.model('User');

var filename = __dirname + "/config.json";
var result = fs.readFileSync(filename);
if (!result) {
    throw new Error("Couldn't read config file " + filename);
}
var configTwitter = JSON.parse(result);
console.log("Successfully read and parsed config file \n" + JSON.stringify(configTwitter, null, " ") + "\n");

var T = new Twit(configTwitter);

//
// filter the public stream by english tweets containing `#apple`
//
var stream = T.stream('user', {
    track: 'n_nishioka'
});
//var stream = T.stream('statuses/filter', {
//    track: 'Oculus',
//    language: 'ja'
//});

var getImageBase64 = function(url, callback) {
    // 1. Loading file from url:
    http.get(url, function(res) { // url is the url of a PNG image.
        var body = '';
        res.setEncoding('binary');

        res.on('data', function(chunk) {
            if (res.statusCode === 200) body += chunk;
        });

        res.on('end', function(res) { // 2. When loaded, do:
            //            console.log("1:Loaded response >>> " + body); // print-check xhr response 
            var imgBase64 = new Buffer(body, 'binary').toString('base64'); // convert to base64
            callback(imgBase64); //execute callback function with data
        });
    }).on('error', function(e) {
        console.log(e.message); //エラー時
    });
};

stream.on('tweet', function(tweet) {
    if (typeof tweet.retweeted_status !== 'undefined') {
        User.findOneAndUpdate({
                id_str: tweet.retweeted_status.user.id_str
            },
            tweet.retweeted_status.user, {
                new: true,
                safe: true,
                upsert: true
            },
            function(err, retweet_user) {
                if (err) console.error(err);
                tweet.retweeted_status.user = retweet_user._id;
                Tweet.findOneAndUpdate({
                        id_str: tweet.retweeted_status.id_str
                    },
                    tweet.retweeted_status, {
                        new: true,
                        safe: true,
                        upsert: true
                    },
                    function(err, retweet) {
                        if (err) console.error(err);
                        User.findOneAndUpdate({
                                id_str: tweet.user.id_str
                            },
                            tweet.user, {
                                new: true,
                                safe: true,
                                upsert: true
                            },
                            function(err, user) {
                                if (err) console.error(err);
                                tweet.user = user._id;
                                tweet.retweeted_status = retweet._id;
                                Tweet.findOneAndUpdate({
                                        id_str: tweet.id_str
                                    },
                                    tweet, {
                                        new: true,
                                        safe: true,
                                        upsert: true
                                    },
                                    function(err, post) {
                                        console.log('post: ', util.inspect(post, false, null));
                                        if (err) console.error(err);
                                        console.log(util.inspect(post, false, null));
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    }

    //SVG DOM injection
    getImageBase64(tweet.user.profile_image_url, function(encode) {
        //console.log('data:image/png;base64,' + encode); // replace link by data URI
        tweet.user.profile_image_url = 'data:image/png;base64,' + encode;
        User.findOneAndUpdate({
                id_str: tweet.user.id_str
            },
            tweet.user, {
                new: true,
                safe: true,
                upsert: true
            },
            function(err, user) {
                if (err) console.error(err);
                tweet.user = user._id;
                Tweet.findOneAndUpdate({
                        id_str: tweet.id_str
                    },
                    tweet, {
                        new: true,
                        safe: true,
                        upsert: true
                    },
                    function(err, post) {
                        if (err) console.error(err);
                        console.log(util.inspect(post, false, null));
                    }
                );
            }
        );
        io.sockets.emit('msg', tweet);
    });
});
