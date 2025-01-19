'use strict'

const path = require('path')
const $ = require('../../src')

const SCRIPT_PATH = path.resolve(__dirname, 'worker.js')

const main = async () => {
  const subprocess = $('node', [SCRIPT_PATH], {
    detached: process.platform !== 'win32',
    stdio: ['pipe', 'pipe', 'pipe', 'ipc']
  })

  const url = 'http://vercel.com'
  const html = await fetch(url).then(res => res.text())

  subprocess.send({ url, html })

  const { promise, resolve, reject } = Promise.withResolvers()

  subprocess.on('message', resolve)
  subprocess.on('error', reject)
  return promise
}

main()
  .then(result => console.log(result))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
