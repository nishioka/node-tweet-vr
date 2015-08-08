var express = require('express');
var router = express.Router();

module.exports = function(app) {
    app.use('/', router);
};

router.get('/tweet', function(req, res, next) {
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
