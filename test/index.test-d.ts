import $ from '..'

/* basic */

const promise = $('curl https://www.youtube.com/watch?v=6xKWiCMKKJg')

// at this point it's a child_process instance
promise.kill()
promise.ref()
promise.unref()

const result = await promise

// after that stdout/stderr are available as string values

console.log(result.stdout)
console.log(result.stderr)

console.log(result.connected)
console.log(result.signalCode)
console.log(result.exitCode)
console.log(result.killed)
console.log(result.spawnfile)
console.log(result.spawnargs)
console.log(result.pid)
console.log(result.stdin)
console.log(result.stdout)
console.log(result.stderr)
console.log(result.stdin)
