'use strict'

const { spawn } = require('child_process')
const { EOL } = require('os')

const eos = (stream, listener, buffer = []) =>
  stream[listener].on('data', data => buffer.push(data)) && buffer

const clean = str => str.replace(new RegExp(`\\s*${EOL}$`), '')

const parseStdout = (stdout, opts) => (encoding, start, end) => {
  const data = clean(stdout.toString(encoding, start, end))
  return opts.json ? JSON.parse(data) : data
}

const parseStderr = stderr => (encoding, start, end) =>
  clean(stderr.toString(encoding, start, end))

const extend = defaults => (input, options) => {
  const [cmd, ...args] = input.split(' ').filter(Boolean)

  return new Promise((resolve, reject) => {
    const opts = { ...defaults, ...options }
    const childProcess = spawn(cmd, args, opts)
    const stdout = eos(childProcess, 'stdout')
    const stderr = eos(childProcess, 'stderr')

    childProcess
      .on('error', reject)
      .on('exit', code => {
        Object.defineProperty(childProcess, 'stdout', { get: parseStdout(stdout, opts) })
        Object.defineProperty(childProcess, 'stderr', { get: parseStderr(stderr) })
        if (code === 0) return resolve(childProcess)
        let command = `The command spawned as:${EOL}${EOL}`
        command += `  ${cmd} ${args.join(' ')}${EOL}${EOL}`
        command += `failed with code ${code}:${EOL}${EOL}`
        command += String(stderr).split(EOL).map(line => `  ${line}`).join(EOL)
        const error = new Error(command)
        error.name = 'ChildProcessError'
        Object.keys(childProcess).forEach(key => { error[key] = childProcess[key] })
        reject(error)
      })
  })
}

const $ = extend()
$.extend = extend
$.json = $.extend({ json: true })

module.exports = $
