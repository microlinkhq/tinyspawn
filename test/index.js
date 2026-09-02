'use strict'

const { execSync } = require('child_process')
const { Writable } = require('stream')
const { EOL } = require('os')
const test = require('ava').default

const isWindows = require('os').platform() === 'win32'

const SHELL = isWindows ? 'cmd.exe' : execSync('which sh').toString().trim()

const $ = require('..').extend({ shell: SHELL })

test('meaningful errors', async t => {
  const error = await $('node --foo').catch(error => error)
  t.is(error.name, 'ChildProcessError')
  t.is(error.stderr, 'node: bad option: --foo')
  t.is(error.stdout, '')
  t.is(error.exitCode, 9)
  t.is(error.signalCode, null)
  t.is(error.killed, false)
})

test.serial('run a command', async t => {
  {
    const result = await $('echo hello world')
    t.is(result.stdout, 'hello world')
    t.is(result.spawnfile, SHELL)
    t.deepEqual(
      result.spawnargs,
      isWindows
        ? [SHELL, '/d', '/s', '/c', '"echo hello world"']
        : [SHELL, '-c', 'echo hello world']
    )
  }
  {
    const result = await $('echo $0', { argv0: 'hello world' })
    t.is(result.stdout, isWindows ? '$0' : 'hello world')
    t.is(result.spawnfile, SHELL)
    t.deepEqual(
      result.spawnargs,
      isWindows ? ['hello world', '/d', '/s', '/c', '"echo $0"'] : ['hello world', '-c', 'echo $0']
    )
  }
  {
    const result = await $('echo', ['hello world'])
    t.is(result.stdout, 'hello world')
    t.is(result.spawnfile, SHELL)
    t.deepEqual(
      result.spawnargs,
      isWindows
        ? [SHELL, '/d', '/s', '/c', '"echo hello world"']
        : [SHELL, '-c', 'echo hello world']
    )
  }
  {
    const result = await $('echo', ['hello $0'], { argv0: 'world' })
    t.is(result.stdout, isWindows ? 'hello $0' : 'hello world')
    t.is(result.spawnfile, SHELL)
    t.deepEqual(
      result.spawnargs,
      isWindows ? ['world', '/d', '/s', '/c', '"echo hello $0"'] : ['world', '-c', 'echo hello $0']
    )
  }
})

// A non-shell instance so `spawnargs` reflects the real argument vector.
const $bare = require('..')

// Prints the arguments node received after `-e <script>`, one per line.
const PRINT_ARGV = 'process.argv.slice(1).forEach(arg => console.log(arg))'

test('array form keeps each value as a single opaque argument', async t => {
  // Argument injection regression: a value containing a space must NOT become
  // two separate arguments. This is the reporter's PoC, expressed with `node`
  // (available on every CI platform) instead of `cat`.
  const evil = 'a.txt b.txt'
  const result = await $bare('node', ['-e', PRINT_ARGV, evil])
  t.deepEqual(result.spawnargs, ['node', '-e', PRINT_ARGV, 'a.txt b.txt'])
  t.is(result.stdout, 'a.txt b.txt')
})

test('array form keeps empty-string arguments', async t => {
  const result = await $bare('node', ['-e', PRINT_ARGV, '', false, null, undefined, 'x'])
  t.deepEqual(result.spawnargs, ['node', '-e', PRINT_ARGV, '', 'x'])
})

test('array form does not split the command string', async t => {
  const subprocess = $bare('git commit', ['-m', 'msg'])
  t.is(subprocess.spawnfile, 'git commit')
  t.deepEqual(subprocess.spawnargs, ['git commit', '-m', 'msg'])
  const error = await t.throwsAsync(subprocess)
  t.is(error.code, 'ENOENT')
})

test('array form keeps a command path with spaces as one file', async t => {
  const { copyFileSync, mkdtempSync, rmSync, symlinkSync } = require('fs')
  const { tmpdir } = require('os')
  const path = require('path')

  const dir = mkdtempSync(path.join(tmpdir(), 'tiny spawn-'))
  t.teardown(() => rmSync(dir, { recursive: true, force: true }))

  const binary = path.join(dir, path.basename(process.execPath))
  if (process.platform === 'win32') copyFileSync(process.execPath, binary)
  else symlinkSync(process.execPath, binary)

  const evil = 'a.txt b.txt'
  const result = await $bare(binary, ['-e', PRINT_ARGV, evil])
  t.is(result.spawnfile, binary)
  t.deepEqual(result.spawnargs, [binary, '-e', PRINT_ARGV, evil])
  t.is(result.stdout, evil)
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
    write (chunk, _, callback) {
      this.buffer.push(chunk)
      callback()
    }
  })

  const subprocess = $('echo 1234567890')
  subprocess.stdout.pipe(stream)
  await subprocess

  t.is(stream.buffer.toString(), `1234567890${EOL}`)
})

test('passing timeout', async t => {
  const result = await $('sleep 3 && echo OK', {
    shell: true,
    timeout: 1,
    killSignal: 'SIGKILL'
  }).catch(err => err)
  t.is(result.killed, true)
  t.is(result.signalCode, 'SIGKILL')
})

test('event emitter properties are availables', async t => {
  const subprocess = $('echo 1234567890')
  await new Promise(resolve => subprocess.once('spawn', resolve))
  const result = await subprocess
  t.is(result.stdout, '1234567890')
  t.is(result.exitCode, 0)
  ;[
    'constructor',
    'setMaxListeners',
    'getMaxListeners',
    'emit',
    'addListener',
    'on',
    'prependListener',
    'once',
    'prependOnceListener',
    'removeListener',
    'off',
    'removeAllListeners',
    'listeners',
    'rawListeners',
    'listenerCount',
    'eventNames'
  ].forEach(name => t.truthy(subprocess[name]))
})

test('child process properties are available', async t => {
  const subprocess = $('echo 1234567890')
  await new Promise(resolve => subprocess.once('spawn', resolve))
  const result = await subprocess
  t.is(result.stdout, '1234567890')
  t.is(result.exitCode, 0)
  ;['kill', 'ref', 'unref'].forEach(name => t.truthy(subprocess[name]))
})

test('handle stdout/stderr as inherit', async t => {
  const { stdout, stderr } = await $('echo ""', { stdio: 'inherit' })
  t.is(stdout, '')
  t.is(stderr, '')
})

test('resolve even if exit code is not 0 if reject=false', async t => {
  const result = await $('exit 1', { reject: false })
  t.is(result.exitCode, 1)
  t.is(result.error instanceof Error, true)
})

test('resolve even if killed if reject=false', async t => {
  const subprocess = $('sleep 1', { reject: false })
  subprocess.kill()
  const result = await subprocess
  t.is(result.signalCode, 'SIGTERM')
  t.is(result.error instanceof Error, true)
})
