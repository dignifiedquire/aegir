'use strict'
const path = require('path')
const execa = require('execa')
const { hook } = require('../utils')

module.exports = (argv) => {
  const input = argv._.slice(1)
  const forwardOptions = argv['--'] ? argv['--'] : []
  const watch = argv.watch ? ['--watch'] : []
  const files = argv.files.length ? [...argv.files] : ['test/**/*.spec.js']
  const verbose = argv.verbose ? ['--log-level', 'debug'] : ['--log-level', 'error']
  const grep = argv.grep ? ['--grep', argv.grep] : []
  const progress = argv.progress ? ['--reporter=progress'] : []
  const bail = argv.bail ? ['--bail', argv.bail] : []

  return hook('browser', 'pre')(argv.userConfig)
    .then(() => {
      return execa('electron-mocha', [
        ...input,
        ...files,
        ...watch,
        ...verbose,
        ...grep,
        ...progress,
        ...bail,
        ...forwardOptions
      ], {
        env: {
          AEGIR_WEBWORKER: argv.webworker,
          NODE_ENV: process.env.NODE_ENV || 'test'
        },
        localDir: path.join(__dirname, '../..'),
        stdio: 'inherit'
      })
    })
    .then(() => hook('browser', 'post')(argv.userConfig))
}
