var express = require('express');
var router = express.Router();

var http = require('http');

module.exports = function(app) {
    app.use('/', router);
};

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

router.get('/tweet', function(req, res, next) {
    var io = require('../lib/share').io;
    var stream = require('../lib/share').stream;

    stream.on('tweet', function (tweet) {
        //if (typeof tweet.retweeted_status === 'undefined') {
        //    return;
        //}
        console.log(tweet);
        //SVG DOM injection
        getImageBase64(tweet.user.profile_image_url, function (encode) {
            //console.log('data:image/png;base64,' + encode); // replace link by data URI
            tweet.user.profile_image_url = 'data:image/png;base64,' + encode;
            io.sockets.emit('msg', tweet);
        });
    });

    res.render('tweet', {
        title: 'Express'
    });

/*
        User.findOneAndUpdate({
                id_str: tweet.retweeted_status.user.id_str
            },
            tweet.retweeted_status.user, {
                new: true,
                safe: true,
                upsert: true
            },
            function (err, retweet_user) {
                if (err) {
                    console.error(err);
                }
                tweet.retweeted_status.user = retweet_user._id;
                Tweet.findOneAndUpdate({
                        id_str: tweet.retweeted_status.id_str
                    },
                    tweet.retweeted_status, {
                        new: true,
                        safe: true,
                        upsert: true
                    },
                    function (err, retweet) {
                        if (err) {
                            console.error(err);
                        }
                        User.findOneAndUpdate({
                                id_str: tweet.user.id_str
                            },
                            tweet.user, {
                                new: true,
                                safe: true,
                                upsert: true
                            },
                            function (err, user) {
                                if (err) {
                                    console.error(err);
                                }
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
                                    function (err, post) {
                                        console.log('post: ', util.inspect(post, false, null));
                                        if (err) {
                                            console.error(err);
                                        }
                                        console.log(util.inspect(post, false, null));
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
*/

});
