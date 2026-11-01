/**
 * Contract for remembering the shipped right column's width and open state.
 *
 * DSH's layout store is not persisted, so its first `openRightbar` falls back to
 * 45% of the viewport. This plugin bridges the controller's own actions
 * (`ctx.get('layout').panels`) — the same object the frame's drag handle writes —
 * to learn and replay the last width.
 */
import { readFileSync } from 'node:fs'

const KEY = 'dsh-sidebar:rightbar-layout:v1'
const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8')

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

// ── browser-module harness: evaluate the client bundle with stubs ───────────
const storage = new Map()
let entry
const fakeWindow = {
  __ModuleLoader__: { load: (value) => { entry = value } },
  localStorage: {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
  // Debounced persistence runs inline so the contract stays deterministic.
  setTimeout: (fn) => { fn(); return 1 },
  clearTimeout: () => {},
}
const reactStub = { createElement: () => null, Component: class {} }

new Function('window', source)(fakeWindow)
const clientModule = entry.factory(() => reactStub)
const api = clientModule.__test ?? {}

const makePanels = () => {
  const calls = []
  return {
    calls,
    panels: {
      setRightbar: (px) => calls.push(['setRightbar', px]),
      openRightbar: (track, fullscreen) => calls.push(['openRightbar', track, fullscreen]),
      closeRightbar: () => calls.push(['closeRightbar']),
    },
  }
}

// ── restore: seeded width must win before the first open ───────────────────
storage.set(KEY, JSON.stringify({ width: 520, shown: true }))
const bridge = api.bridgeRightbarLayout ?? (() => () => {})
const restore = makePanels()
const dispose = bridge({ panels: restore.panels })
check('replays the remembered width before opening', restore.calls, [['setRightbar', 520]])

// ── learn: a drag through setRightbar is persisted ────────────────────────
restore.panels.setRightbar(640)
check('persists a dragged width', JSON.parse(storage.get(KEY)).width, 640)
check('keeps the open state while resizing', JSON.parse(storage.get(KEY)).shown, true)

// ── learn: open/close transitions are persisted ───────────────────────────
restore.panels.closeRightbar()
check('persists a closed column', JSON.parse(storage.get(KEY)).shown, false)
restore.panels.openRightbar(true, false)
check('persists an opened column', JSON.parse(storage.get(KEY)).shown, true)

// ── teardown restores the original actions and stops learning ─────────────
dispose()
const afterDispose = restore.calls.length
restore.panels.setRightbar(700)
check('teardown restores setRightbar', JSON.parse(storage.get(KEY)).width, 640)
check('teardown stops recording calls', restore.calls.length, afterDispose + 1)

// ── startup policy: a column the user closed stays closed ─────────────────
storage.set(KEY, JSON.stringify({ width: 600, shown: false }))
check('closed layout suppresses auto open', api.shouldAutoOpenRightbar?.(), false)
storage.set(KEY, JSON.stringify({ width: 600, shown: true }))
check('open layout allows auto open', api.shouldAutoOpenRightbar?.(), true)
storage.delete(KEY)
check('first run keeps the default auto open', api.shouldAutoOpenRightbar?.(), true)

// ── no layout service: bridging must be inert, not throwing ───────────────
let inert
try {
  inert = typeof bridge({})
} catch {
  inert = 'threw'
}
check('bridging without a layout is inert', inert, 'function')

console.log(failures === 0 ? '\nrightbar layout contract passed' : `\n${failures} check(s) failed`)
process.exitCode = failures === 0 ? 0 : 1
