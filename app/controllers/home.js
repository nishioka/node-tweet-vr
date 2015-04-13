var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    Tweet = mongoose.model('Tweet');

module.exports = function(app) {
    app.use('/', router);
};

router.get('/', function(req, res, next) {
    Tweet.find(function(err, articles) {
        if (err) return next(err);
        res.render('index', {
            title: 'Generator-Express MVC',
            articles: articles
        });
    });
});
