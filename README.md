<div align="center">
  <img src="https://github.com/microlinkhq/cdn/raw/master/dist/logo/banner.png#gh-light-mode-only" alt="microlink cdn">
  <img src="https://github.com/microlinkhq/cdn/raw/master/dist/logo/banner-dark.png#gh-dark-mode-only" alt="microlink cdn">
  <br>
  <br>
</div>

![Last version](https://img.shields.io/github/tag/microlinkhq/tinyspawn.svg?style=flat-square)
[![Coverage Status](https://img.shields.io/coveralls/microlinkhq/tinyspawn.svg?style=flat-square)](https://coveralls.io/github/microlinkhq/tinyspawn)
[![NPM Status](https://img.shields.io/npm/dm/tinyspawn.svg?style=flat-square)](https://www.npmjs.org/package/tinyspawn)

**tinyspawn** is a minimalistic [child_process](https://nodejs.org/api/child_process.html) wrapper with following features:

- Small (~50 LOC, 600 bytes).
- Focus on performance.
- Zero dependencies.
- Meaningful errors.
- Easy to extend.

## Install

```bash
$ npm install tinyspawn --save
```

## Usage

### Getting started

The [child_process](https://nodejs.org/api/child_process.html) in Node.js is great, but I always found the API confusing and hard to remember.

That's why I created **tinyspawn**. It's recommended to bind it to `$`:

```js
const $ = require('tinyspawn')
```

The first argument is the command (with arguments) to be executed:

```js
const { stdout } = await $(`node -e 'console.log("hello world")'`)
console.log(stdout) // => 'hello world'
```

The second argument is any of the [spawn#options](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options):

```js
const { stdout } = $(`node -e 'console.log("hello world")'`, {
  shell: true
})
```

When you execute a command, it returns a [ChildProcess](https://nodejs.org/api/child_process.html#class-childprocess) instance:

```js
const {
  signalCode,
  exitCode,
  killed,
  spawnfile,
  spawnargs,
  pid,
  stdin,
  stdout,
  stderr,
  stdin
} = await $('date')
```

### Piping streams

Since **tinyspawn** returns a [ChildProcess](https://nodejs.org/api/child_process.html#class-childprocess) instance, you can use it for interacting with other Node.js streams:

```js
const subprocess = $('echo 1234567890')
subprocess.stdout.pipe(process.stdout) // => 1234567890

/* You can also continue interacting with it as a promise */

const { stdout } = await subprocess
console.log(stdout) // => 1234567890
```

or stdin:

```js
const { Readable } = require('node:stream')

const subprocess = $('cat', { stdin: 'hello world' })
Readable.from('hello world').pipe(subprocess.stdin)
const {stdout} = await subprocess

console.log(stdout) // 'hello world'
```

### JSON parsing

A CLI program commonly supports a way to return a JSON that makes it easy to connect with other programs.

**tinyspawn** has been designed to be easy to work with CLI programs, making it possible to call `$.json` or pass `{ json: true }` as an option:

```js
const { stdout } = await $.json(`curl https://geolocation.microlink.io`)
```

### Extending behavior

Although you can pass [spawn#options](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options) as a second argument, sometimes defining something as default behavior is convenient.

**tinyspawn** exports the method `$.extend` to create a tinyspawn with [spawn#options](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options) defaults set:

```js
const $ = require('tinyspawn').extend({
  timeout: 5000,
  killSignal: 'SIGKILL'
})
```

### Meaningful errors

When working with CLI programs and something wrong happens, it's crucial to present the error as readable as possible.

**tinyspawn** prints meaningful errors to help you understa dn what happened:

```js
const error = await $(`node -e 'require("notfound")'`).catch(error => error)

console.error(error)
// The command spawned as:
//
//   /Users/kikobeats/.n/bin/node -e 'require("notfound")'
//
// exited with `{ code: 1 }` and the following trace:
//
//   node:internal/modules/cjs/loader:1147
//     throw err;
//     ^
//
//   Error: Cannot find module 'notfound'
//   Require stack:
//   - /Users/kikobeats/Downloads/tinyspawn/[eval]
//       at Module._resolveFilename (node:internal/modules/cjs/loader:1144:15)
//       at Module._load (node:internal/modules/cjs/loader:985:27)
//       at Module.require (node:internal/modules/cjs/loader:1235:19)
//       at require (node:internal/modules/helpers:176:18)
//       at [eval]:1:1
//       at runScriptInThisContext (node:internal/vm:144:10)
//       at node:internal/process/execution:109:14
//       at [eval]-wrapper:6:24
//       at runScript (node:internal/process/execution:92:62)
//       at evalScript (node:internal/process/execution:123:10) {
//     code: 'MODULE_NOT_FOUND',
//     requireStack: [ '/Users/kikobeats/Downloads/tinyspawn/[eval]' ]
//   }

//   Node.js v20.10.0
```

The [ChildProcess](https://nodejs.org/api/child_process.html#class-childprocess) instance properties are also available as part of the error:

```js
const { stdout: node } = await $('which node')

const error = await $(`${node} -e 'require("notfound")'`).catch(error => error)

const {
  signalCode,
  exitCode,
  killed,
  spawnfile,
  spawnargs,
  pid,
  stdin,
  stdout,
  stderr,
  stdin
} = error
```

## License

**tinyspawn** © [microlink.io](https://microlink.io), released under the [MIT](https://github.com/microlinkhq/tinyspawn/blob/master/LICENSE.md) License.<br>
Authored and maintained by [Kiko Beats](https://kikobeats.com) with help from [contributors](https://github.com/microlinkhq/tinyspawn/contributors).

> [microlink.io](https://microlink.io) · GitHub [microlink.io](https://github.com/microlinkhq) · Twitter [@microlinkhq](https://twitter.com/microlinkhq)
