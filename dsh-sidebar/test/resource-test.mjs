/**
 * Resource invariants: the things that turn into leaks over a long session.
 * Run with the bundled Node:  node test/resource-test.mjs
 */
import { readFileSync } from 'node:fs'

const read = (name) => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8')
const client = read('client.js')
const host = read('index.js')

let failures = 0
const check = (label, actual, expected) => {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a === e) {
    console.log(`ok   ${label}`)
    return
  }
  failures += 1
  console.log(`FAIL ${label}\n  expected ${e}\n  actual   ${a}`)
}

const count = (source, pattern) => (source.match(pattern) ?? []).length

for (const [name, source] of [['client', client], ['host', host]]) {
  check(`${name}: no setInterval`, count(source, /setInterval\s*\(/g), 0)
  check(`${name}: every addEventListener is removed`, count(source, /addEventListener\s*\(/g), count(source, /removeEventListener\s*\(/g))
}

// Every timer a component or effect starts must be cancelled somewhere.
check(
  'client: clearTimeout covers every setTimeout',
  count(client, /clearTimeout\s*\(/g) >= count(client, /setTimeout\s*\(/g),
  true,
)

// Module-level caches must state their bound.
check('client: browser memory is capped', /BROWSER_MEMORY_LIMIT\s*=\s*\d+/.test(client), true)
check('client: no unbounded per-session map', /attempts\.set\(/.test(client), false)

// The right column keeps several Session views mounted; the sheet is injected once.
check('client: stylesheet is not rendered per panel', /h\('style'/.test(client), false)
check('client: stylesheet has a disposer', /style\.remove\(\)/.test(client), true)

// Host resources: one route registration owned by one effect, no caches.
check('host: single webServer route registration', count(host, /webServer\.register\(/g), 1)
check('host: no module-level cache map', /^(?:const|let) [a-zA-Z]+ = new Map\(/m.test(host), false)

console.log(failures === 0 ? '\nall resource checks passed' : `\n${failures} check(s) failed`)
process.exitCode = failures === 0 ? 0 : 1
