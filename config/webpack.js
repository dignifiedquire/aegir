'use strict'

const path = require('path')
const upperFirst = require('lodash.upperfirst')
const camelCase = require('lodash.camelcase')
const merge = require('webpack-merge')

let user = require('./user')

// e.g. peer-id -> PeerId
const libraryName = upperFirst(camelCase(user.pkg.name))
const specific = merge(user.customPkg || {}, user.customPkg || {})

const shared = {
  entry: [
    path.resolve('src/index.js')
  ],
  output: {
    filename: 'index.js',
    library: libraryName,
    path: 'dist'
  },
  resolve: {
    modules: [
      'node_modules',
      path.resolve(__dirname, '../node_modules')
    ],
    alias: {
      zlib: 'browserify-zlib'
    }
  },
  resolveLoader: {
    modules: [
      'node_modules',
      path.resolve(__dirname, '../node_modules')
    ]
  },
  module: {
    loaders: [{
      test: /\.json$/,
      loader: 'json'
    }]
  },
  node: {
    Buffer: true
  },
  plugins: [],
  target: 'web'
}

const dev = merge(shared, {
  devtool: 'inline-source-map'
}, specific)

module.exports = dev
