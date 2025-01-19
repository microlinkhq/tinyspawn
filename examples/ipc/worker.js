'use strict'

const { Readability } = require('@mozilla/readability')

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

process.on('message', async ({ url, html, readabilityOpts } = {}) => {
  const document = getDocument({ url, html })
  const reader = new Readability(document, readabilityOpts)
  const result = parseReader(reader)
  process.send(result, () => process.exit(0))
})
