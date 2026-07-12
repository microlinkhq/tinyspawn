'use strict'

const { spawn } = require('child_process')
const { EOL } = require('os')

const EE_PROPS = Object.getOwnPropertyNames(require('events').EventEmitter.prototype)
  .filter(name => !name.startsWith('_'))
  .concat(['kill', 'ref', 'unref'])

const eos = (stream, listener, buffer = []) =>
  stream[listener] ? stream[listener].on('data', data => buffer.push(data)) && buffer : buffer

const createChildProcessError = ({ cmd, cmdArgs, childProcess }) => {
  const command = `${cmd} ${cmdArgs.join(' ')}`
  let message = `The command spawned as:${EOL}${EOL}`
  message += `  \`${command}\`${EOL}${EOL}`
  message += `exited with:${EOL}${EOL}`
  message += `  \`{ signal: '${childProcess.signalCode}', code: ${childProcess.exitCode} }\` ${EOL}${EOL}`
  message += `with the following trace:${EOL}`
  const error = new Error(message)
  error.command = command
  error.name = 'ChildProcessError'

  Object.keys(childProcess)
    .filter(key => !key.startsWith('_') && !['stdio', 'stdin'].includes(key))
    .forEach(key => {
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

const isTemplate = value =>
  Array.isArray(value) && Object.prototype.hasOwnProperty.call(value, 'raw')

// Build the argument vector from a tagged template, keeping every interpolated
// value as a single opaque argument. Whitespace only splits arguments when it
// appears in the *static* parts of the template, never inside an interpolation.
const templateArgs = (strings, values) => {
  const args = []
  let current = null

  const close = () => {
    if (current !== null) args.push(current)
    current = null
  }

  const appendText = text =>
    text.split(/\s+/).forEach((segment, index) => {
      if (index > 0) close()
      if (segment !== '') current = (current ?? '') + segment
    })

  const appendValue = value =>
    (Array.isArray(value) ? value : [value]).forEach((item, index) => {
      if (index > 0) close()
      current = (current ?? '') + String(item)
    })

  strings.forEach((string, index) => {
    appendText(string)
    if (index < values.length) appendValue(values[index])
  })
  close()

  return args
}

const run = (defaults, cmd, cmdArgs, options) => {
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
      if (exitCode !== 0) {
        const error = createChildProcessError({ cmd, cmdArgs, childProcess })
        if (opts.reject !== false) return reject(error)
        childProcess.error = error
      }
      return resolve(childProcess)
    })
  })

  const subprocess = Object.assign(promise, childProcess)
  if (childProcess) {
    EE_PROPS.forEach(name => (subprocess[name] = childProcess[name].bind(childProcess)))
  }
  return subprocess
}

const extend =
  defaults =>
    (input, ...rest) => {
      if (isTemplate(input)) {
        const [cmd, ...cmdArgs] = templateArgs(input, rest).filter(Boolean)
        return run(defaults, cmd, cmdArgs)
      }
      let [args, options] = rest
      if (!(args instanceof Array)) {
        options = args
        args = []
      }
      const [cmd, ...cmdArgs] = input.split(' ').concat(args).filter(Boolean)
      return run(defaults, cmd, cmdArgs, options)
    }

const $ = extend()
$.extend = extend
$.json = $.extend({ json: true })

module.exports = $
