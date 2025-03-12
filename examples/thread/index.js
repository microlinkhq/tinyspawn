'use strict'

const path = require('path')

const SCRIPT_PATH = path.resolve(__dirname, 'worker.js')

const { Worker } = require('worker_threads')

const main = async () => {
  const url = 'http://vercel.com'
  const html = await fetch(url).then(res => res.text())

  const worker = new Worker(SCRIPT_PATH, {
    workerData: {
      url,
      html
    }
  })

  const { promise, resolve, reject } = Promise.withResolvers()

  worker.on('message', resolve)
  worker.on('error', reject)
  return promise
}

main()
  .then(result => {
    console.log(JSON.parse(result))
  })
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
