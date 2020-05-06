'use strict'

const merge = require('webpack-merge')
const webpack = require('webpack')
const webpackConfig = require('./webpack.config')
const { fromRoot, hasFile } = require('../utils')
const userConfig = require('./user')()

const isWebworker = process.env.AEGIR_RUNNER === 'webworker'

// Env to pass in the bundle with DefinePlugin
const env = {
  'process.env': JSON.stringify(process.env),
  TEST_DIR: JSON.stringify(fromRoot('test')),
  TEST_BROWSER_JS: hasFile('test', 'browser.js')
    ? JSON.stringify(fromRoot('test', 'browser.js'))
    : JSON.stringify('')
}

// Webpack overrides for karma
const karmaWebpackConfig = merge.strategy({ plugins: 'replace' })(webpackConfig(), {
  entry: '',
  output: {
    libraryTarget: 'var'
  },
  plugins: [
    new webpack.DefinePlugin(env)
  ]
})

const karmaConfig = (config, argv) => {
  const files = argv.filesCustom
  const mocha = {
    reporter: 'spec',
    timeout: argv.timeout ? Number(argv.timeout) : 5000,
    bail: argv.bail,
    grep: argv.grep
  }

  const karmaEntry = `${__dirname}/karma-entry.js`

  if (!files.length) {
    // only try to load *.spec.js if we aren't specifying custom files
    files.push(karmaEntry)
  }

  return {
    browsers: ['ChromeHeadlessNoSandbox'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      }
    },
    frameworks: isWebworker ? ['mocha-webworker'] : ['mocha'],
    basePath: process.cwd(),
    files: files
      .map(f => {
        return {
          pattern: f,
          included: !isWebworker
        }
      })
      .concat([
        {
          pattern: 'test/fixtures/**/*',
          watched: false,
          served: true,
          included: false
        }
      ]),

    preprocessors: files.reduce((acc, f) => {
      acc[f] = ['webpack', 'sourcemap']
      return acc
    }, {}),

    client: {
      mocha,
      mochaWebWorker: {
        pattern: [
          ...files,
          'karma-entry.js'
        ],
        mocha
      }
    },

    webpack: karmaWebpackConfig,

    webpackMiddleware: {
      stats: 'errors-only'
    },

    reporters: [
      argv.progress && 'progress',
      !argv.progress && 'mocha'
    ].filter(Boolean),

    mochaReporter: {
      output: 'autowatch',
      showDiff: true
    },

    plugins: [
      'karma-chrome-launcher',
      'karma-edge-launcher',
      'karma-firefox-launcher',
      'karma-mocha',
      'karma-mocha-reporter',
      'karma-mocha-webworker',
      'karma-sourcemap-loader',
      'karma-webpack'
    ],

    autoWatch: false,
    singleRun: true,
    colors: true,
    browserNoActivityTimeout: 50 * 1000
  }
}

module.exports = (config) => {
  var argv = require('yargs-parser')(process.argv.slice(2), {
    array: ['files-custom'],
    boolean: ['progress', 'bail'],
    string: ['timeout']
  })
  config.set(merge(karmaConfig(config, argv), userConfig.karma))
}
