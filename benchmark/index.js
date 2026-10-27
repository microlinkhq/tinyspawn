'use strict'

const { writeFileSync } = require('fs')
const { join } = require('path')
const { setFlagsFromString } = require('v8')
const { runInNewContext } = require('vm')

const $ = require('..')

const RUNS = 7
const SPAWNS = 10
const STDOUT_READS = 30
const STDOUT_BYTES = 50 * 1024 * 1024

const NOOP_ARGS = ['-e', '0']
const LARGE_STDOUT_ARGS = ['-e', `process.stdout.write(Buffer.alloc(${STDOUT_BYTES}, 97))`]

const median = values => {
  const sorted = values.slice().sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

setFlagsFromString('--expose-gc')
const collectGarbage = runInNewContext('gc')

const now = () => process.hrtime.bigint()

const elapsed = started => Number(now() - started) / 1e6

const spawnNode = args => $(process.execPath, args)

const spawnCase = {
  name: 'spawn node -e 0',
  extra: `${SPAWNS} sequential spawns`,
  setup: () => {},
  timed: async () => {
    let exited = 0
    for (let spawn = 0; spawn < SPAWNS; spawn++) {
      const { exitCode } = await spawnNode(NOOP_ARGS)
      if (exitCode === 0) exited++
    }
    return exited
  },
  verify: exited => exited === SPAWNS
}

const largeStdoutCase = {
  name: 'spawn 50MB stdout',
  extra: `1 spawn writing ${STDOUT_BYTES} bytes`,
  setup: () => {},
  timed: () => spawnNode(LARGE_STDOUT_ARGS),
  verify: result => result.exitCode === 0 && result.stdout.length === STDOUT_BYTES
}

const stdoutReadsCase = {
  name: `read 50MB stdout x${STDOUT_READS}`,
  extra: `${STDOUT_READS} reads of a ${STDOUT_BYTES} byte stdout`,
  setup: async state => {
    state.result = await spawnNode(LARGE_STDOUT_ARGS)
  },
  timed: state => {
    let matched = 0
    for (let read = 0; read < STDOUT_READS; read++) {
      if (state.result.stdout.length === STDOUT_BYTES) matched++
    }
    return matched
  },
  verify: matched => matched === STDOUT_READS
}

const CASES = [spawnCase, largeStdoutCase, stdoutReadsCase]

const fmt = value => value.toFixed(1)

const report = slot => {
  const med = slot.walls.length ? median(slot.walls) : Number.NaN
  const min = slot.walls.length ? Math.min(...slot.walls) : Number.NaN
  const max = slot.walls.length ? Math.max(...slot.walls) : Number.NaN
  const extra = `${slot.entry.extra}, errors ${slot.errors}, runs ${RUNS}`
  console.log(`${slot.entry.name}  median ${fmt(med)}ms  range ${fmt(min)}-${fmt(max)}  ${extra}`)
  return {
    name: slot.entry.name,
    unit: 'ms',
    value: Number(med.toFixed(1)),
    range: `${fmt(min)}-${fmt(max)}`,
    extra
  }
}

const takeSample = async (slot, run) => {
  try {
    collectGarbage()
    const started = now()
    const outcome = await slot.entry.timed(slot.state)
    const wall = elapsed(started)
    if (!slot.entry.verify(outcome)) {
      console.error(`${slot.entry.name} run ${run} produced unexpected output`)
      slot.errors++
      return
    }
    slot.walls.push(wall)
  } catch (error) {
    console.error(error)
    slot.errors++
  }
}

const main = async () => {
  const slots = []
  for (const entry of CASES) {
    const state = {}
    await entry.setup(state)
    await entry.timed(state)
    slots.push({ entry, state, walls: [], errors: 0 })
  }
  for (let run = 0; run < RUNS; run++) {
    for (const slot of slots) await takeSample(slot, run)
  }
  const results = slots.map(report)
  writeFileSync(
    join(__dirname, '..', 'benchmark-output.json'),
    JSON.stringify(results, null, 2) + '\n'
  )
  const errors = slots.reduce((total, slot) => total + slot.errors, 0)
  if (errors > 0 || results.some(result => !Number.isFinite(result.value))) {
    process.exitCode = 1
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
