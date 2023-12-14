'use strict'

const { spawn } = require('child_process')
const { EOL } = require('os')

const eos = (stream, listener, buffer = []) => stream[listener].on('data', data => buffer.push(data)) && buffer

const clean = str => str.trim().replace(/\n$/, '')

const parse = (buffer, { json } = {}) => (encoding, start, end) => {
  const data = clean(Buffer.concat(buffer).toString(encoding, start, end))
  return json ? JSON.parse(data) : data
}

const extend = defaults => (input, args, options) => {
  if (!(args instanceof Array)) { options = args; args = [] }
  const [cmd, ...cmdArgs] = input.split(' ').filter(Boolean).concat(args)
  let childProcess

  const promise = new Promise((resolve, reject) => {
    const opts = { ...defaults, ...options }
    childProcess = spawn(cmd, cmdArgs, opts)
    const stdout = eos(childProcess, 'stdout')
    const stderr = eos(childProcess, 'stderr')

    childProcess
      .on('error', reject)
      .on('exit', code => {
        Object.defineProperty(childProcess, 'stdout', { get: parse(stdout, opts) })
        Object.defineProperty(childProcess, 'stderr', { get: parse(stderr) })
        if (code === 0) return resolve(childProcess)
        const command = `${cmd} ${cmdArgs.join(' ')}`
        let message = `The command spawned as:${EOL}${EOL}`
        message += `  ${command}${EOL}${EOL}`
        message += `exited with \`{ code: ${code} }\` and the following trace:${EOL}${EOL}`
        message += String(stderr).split(EOL).map(line => `  ${line}`).join(EOL)
        const error = new Error(message)
        error.command = command
        error.name = 'ChildProcessError'
        Object.keys(childProcess).forEach(key => { error[key] = childProcess[key] })
        reject(error)
      })
  })

  return Object.assign(promise, childProcess)
}

const $ = extend()
$.extend = extend
$.json = $.extend({ json: true })

module.exports = $
