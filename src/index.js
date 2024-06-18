'use strict'

const { spawn } = require('child_process')
const { EOL } = require('os')

const EE_PROPS = Object.getOwnPropertyNames(require('events').EventEmitter.prototype)
  .filter(name => !name.startsWith('_'))
  .concat(['kill', 'ref', 'unref'])

const eos = (stream, listener, buffer = []) =>
  stream[listener] ? stream[listener].on('data', data => buffer.push(data)) && buffer : buffer

const createChildProcessError = ({ cmd, cmdArgs, exitCode, stderr, childProcess }) => {
  const command = `${cmd} ${cmdArgs.join(' ')}`
  let message = `The command spawned as:${EOL}${EOL}`
  message += `  ${command}${EOL}${EOL}`
  message += `exited with \`{ code: ${exitCode} }\` and the following trace:${EOL}${EOL}`
  message += String(stderr)
    .split(EOL)
    .map(line => `  ${line}`)
    .join(EOL)
  const error = new Error(message)
  error.command = command
  error.name = 'ChildProcessError'
  Object.keys(childProcess).forEach(key => {
    error[key] = childProcess[key]
  })
  return error
}

const clean = str => str.trim().replace(/\n$/, '')

const parse =
  (buffer, { json } = {}) =>
    (encoding, start, end) => {
      const data = clean(Buffer.concat(buffer).toString(encoding, start, end))
      return json ? JSON.parse(data) : data
    }

const extend = defaults => (input, args, options) => {
  if (!(args instanceof Array)) {
    options = args
    args = []
  }
  const [cmd, ...cmdArgs] = input.split(' ').concat(args).filter(Boolean)
  let childProcess

  const promise = new Promise((resolve, reject) => {
    const opts = { ...defaults, ...options }
    childProcess = spawn(cmd, cmdArgs, opts)
    const stdout = eos(childProcess, 'stdout')
    const stderr = eos(childProcess, 'stderr')

    childProcess.on('error', reject).on('exit', exitCode => {
      Object.defineProperty(childProcess, 'stdout', {
        get: parse(stdout, opts)
      })
      Object.defineProperty(childProcess, 'stderr', { get: parse(stderr) })
      return exitCode === 0
        ? resolve(childProcess)
        : reject(createChildProcessError({ cmd, cmdArgs, exitCode, stderr, childProcess }))
    })
  })

  const subprocess = Object.assign(promise, childProcess)
  if (childProcess) {
    EE_PROPS.forEach(name => (subprocess[name] = childProcess[name].bind(childProcess)))
  }
  return subprocess
}

const $ = extend()
$.extend = extend
$.json = $.extend({ json: true })

module.exports = $
