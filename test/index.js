'use strict'

const { Writable } = require('stream')
const { EOL } = require('os')
const test = require('ava')

const $ = require('..').extend({ shell: true })

test('meaningful errors', async t => {
  const error = await $('node --foo').catch(error => error)
  t.is(error.name, 'ChildProcessError')
  t.is(error.stderr, 'node: bad option: --foo')
  t.is(error.stdout, '')
  t.is(error.exitCode, 9)
  t.is(error.signalCode, null)
  t.is(error.killed, false)
})

test('run a command', async t => {
  const { stdout } = await $('echo hello world')
  t.is(stdout, 'hello world')
})

test.serial('last break line is removed', async t => {
  {
    const { stdout } = await $('echo hello world')
    t.is(stdout, 'hello world')
  }
  {
    const { stderr } = await $('echo hello world >&2')
    t.is(stderr, 'hello world')
  }
})

test('run a file', async t => {
  const { stdout } = await $('node -p "\'hello world\'"')
  t.is(stdout, 'hello world')
})

test('output is child_process', async t => {
  const result = await $('echo')
  t.true(result.connected !== undefined)
  t.true(result.signalCode !== undefined)
  t.true(result.exitCode !== undefined)
  t.true(result.killed !== undefined)
  t.true(result.spawnfile !== undefined)
  t.true(result.spawnargs !== undefined)
  t.true(result.pid !== undefined)
  t.true(result.stdin !== undefined)
  t.true(result.stdout !== undefined)
  t.true(result.stderr !== undefined)
  t.true(result.stdin !== undefined)
})

test('$.json', async t => {
  const { stdout } = await require('..').json('curl https://geolocation.microlink.io')
  t.true(!!stdout.ip.address)
})

test('piping subprocess', async t => {
  const stream = new Writable({
    construct (callback) {
      this.buffer = []
      callback()
    },
    write (chunk, encoding, callback) {
      this.buffer.push(chunk)
      callback()
    }
  })

  const subprocess = $('echo 1234567890')
  subprocess.stdout.pipe(stream)
  await subprocess

  t.is(stream.buffer.toString(), `1234567890${EOL}`)
})
