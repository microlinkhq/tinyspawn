# tinyspawn

![Last version](https://img.shields.io/github/tag/kikobeats/tinyspawn.svg?style=flat-square)
[![Coverage Status](https://img.shields.io/coveralls/kikobeats/tinyspawn.svg?style=flat-square)](https://coveralls.io/github/kikobeats/tinyspawn)
[![NPM Status](https://img.shields.io/npm/dm/tinyspawn.svg?style=flat-square)](https://www.npmjs.org/package/tinyspawn)

**tinyspawn** is a minimalistic `child_process` wrapper with following features:

- Small (~50 lines of code).
- Focus on performance.
- Zero dependencies.
- Meaningful errors.
- Easy to extend.

## Install

```bash
$ npm install tinyspawn --save
```

## Usage

### Basic

It's recommended to bind **tinyspawn** to `$`:

```js
const $ = require('tinyspawn')
```

After that, pass the command (with arguments) to execute as first argument:

```js
const { stdout: node }  = await $('which node')
const { stdout } = await $(`${node} -e 'console.log("hello world")'`)
console.log(stdout) // => 'hello world'
```

Additionally, you can pass [spawn#options](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options) as second argument:

```js
const { stdout } = $(`${node} -e 'console.log("hello world")'`, {
  shell: true
})
```

Any of the [ChildProcess](https://nodejs.org/api/child_process.html#class-childprocess) instance properties are available as part of the output:

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

### JSON parsing

**tinyspawn** has been designed to work with CLI commands that outputs json.

You can easily parse it calling `$.json`:

```js
const { stdout } = await $.json(`curl https://geolocation.microlink.io`)
```

### Extending

You can use `$.extend` to pass any [spawn#options](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options) to be used by default:

```js
const $ = require('tinyspawn').extend({ shell: true })
```

### Errors

**tinyspawn** is oriented to print meanigful errors:

```js
const { stdout: node } = await $('which node')

const error = await $(`${node} -e 'require("notfound")'`).catch(error => error)

console.error(error)
// The command spawned as:

//   /Users/kikobeats/.n/bin/node -e 'require("notfound")'

// failed with code 1:

//   node:internal/modules/cjs/loader:1147
//     throw err;
//     ^

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

The childProcess properties are also available as part of the error:

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

**tinyspawn** © [Kiko Beats](https://kikobeats.com), released under the [MIT](https://github.com/kikobeats/tinyspawn/blob/master/LICENSE.md) License.<br>
Authored and maintained by [Kiko Beats](https://kikobeats.com) with help from [contributors](https://github.com/kikobeats/tinyspawn/contributors).

> [kikobeats.com](https://kikobeats.com) · GitHub [Kiko Beats](https://github.com/kikobeats) · Twitter [@kikobeats](https://twitter.com/kikobeats)
