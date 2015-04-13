var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'node-tweet-vr'
    },
    port: 3000,
    db: 'mongodb://localhost/node-tweet-vr-development'
  },

  test: {
    root: rootPath,
    app: {
      name: 'node-tweet-vr'
    },
    port: 3000,
    db: 'mongodb://localhost/node-tweet-vr-test'
  },

  production: {
    root: rootPath,
    app: {
      name: 'node-tweet-vr'
    },
    port: 3000,
    db: 'mongodb://localhost/node-tweet-vr-production'
  }
};

module.exports = config[env];
