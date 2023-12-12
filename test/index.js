'use strict'

const test = require('ava')

const $ = require('..').extend({ shell: true })

test('meaningful errors', async t => {
  const error = await $('node -e \'require("notfound")\'').catch(error => error)
  t.is(error.name, 'ChildProcessError')
  t.is(error.stderr.includes("Cannot find module 'notfound'"), true)
  t.is(error.stdout, '')
  t.is(error.exitCode, 1)
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
  const { stdout } = await $('node -e \'console.log("hello world")\'')
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
