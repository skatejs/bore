const externals = require('webpack-node-externals');

module.exports = {
  type: 'web-module',
  npm: {
    cjs: false,
    esModules: false,
    umd: true
  },
  webpack: {
    extra: {
      externals: [externals()]
    }
  }
};
