'use strict'

const { Readability } = require('@mozilla/readability')

const { workerData, parentPort } = require('node:worker_threads')

const parseReader = reader => {
  try {
    return reader.parse()
  } catch (_) {
    return {}
  }
}

const getDocument = ({ url, html }) => {
  const { Window } = require('happy-dom')
  const window = new Window({ url })
  const document = window.document
  document.documentElement.innerHTML = html
  return document
}

const main = async ({ url, html, readabilityOpts } = {}) => {
  const document = getDocument({ url, html })
  const reader = new Readability(document, readabilityOpts)
  return parseReader(reader)
}

main(workerData).then(result => parentPort.postMessage(JSON.stringify(result)))
