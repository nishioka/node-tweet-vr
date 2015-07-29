var express = require('express');
var router = express.Router();
var passport = require('passport');

module.exports = function(app) {
    app.use('/', router);
};

// GET home page
router.get('/', function(req, res, next) {
    res.render('index', {
        title: 'Express'
    });
});

// GET login
router.get('/login', function(req, res, next) {
    res.render('login', {
        title: 'Express'
    });
});

// ユーザーからリクエストをもらうルート
router.get('/auth/twitter', passport.authenticate('twitter'));

// Twitterからcallbackうけるルート
router.get('/auth/twitter/callback', passport.authenticate('twitter', {
  successRedirect: '/tweet',
  failureRedirect: '/login'
}));
