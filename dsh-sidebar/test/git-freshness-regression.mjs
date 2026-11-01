/**
 * Contract for keeping the Git pane truthful without a manual refresh.
 *
 * Two gaps are covered:
 *  1. the first load must wait for the Session to be open on the Host;
 *  2. a workspace edit must surface on its own — the shipped workspace-files
 *     watch is per-directory and non-recursive, so the pane polls a cheap
 *     fingerprint and only reloads when it actually changes.
 */
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8')

let entry
const fakeWindow = {
  __ModuleLoader__: { load: (value) => { entry = value } },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  setTimeout: (fn) => { fn(); return 1 },
  clearTimeout: () => {},
}
const reactStub = { createElement: () => null, Component: class {} }
new Function('window', source)(fakeWindow)
const api = entry.factory(() => reactStub).__test ?? {}

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

// ── 1. order: never ask the Host before the Session is open ───────────────
const sessionReady = api.sessionReady ?? (() => 'not-implemented')
check('cold Session is not ready', sessionReady('cold'), false)
check('loading Session is not ready', sessionReady('loading'), false)
check('open Session is ready', sessionReady('open'), true)
check('failed Session has settled', sessionReady('error'), true)
check('unknown state keeps the gate closed', sessionReady(undefined), false)

// ── 2. freshness: one fingerprint per status verdict ──────────────────────
const fingerprint = api.gitFingerprint ?? (() => 'not-implemented')
const status = {
  ok: true,
  branch: 'master',
  ahead: 0,
  behind: 0,
  files: [{ path: 'a.txt', code: 'M', staged: false }],
}
check('fingerprint is stable for the same verdict', fingerprint(status), fingerprint({ ...status, files: [...status.files] }))
check('a new changed file changes the fingerprint', fingerprint(status) !== fingerprint({ ...status, files: [] }), true)
check('a branch switch changes the fingerprint', fingerprint(status) !== fingerprint({ ...status, branch: 'dev' }), true)
check('ahead/behind changes the fingerprint', fingerprint(status) !== fingerprint({ ...status, ahead: 1 }), true)
check('a non-repository verdict is stable', fingerprint({ ok: false, reason: 'no-repo' }), fingerprint({ ok: false, reason: 'no-repo' }))
check(
  'a different failure reason changes the fingerprint',
  fingerprint({ ok: false, reason: 'no-repo' }) !== fingerprint({ ok: false, reason: 'git-missing' }),
  true,
)

// ── 3. wiring: the pane polls while visible and stops on unmount ──────────
check('the pane polls on an interval', /setInterval\([\s\S]{0,80}GIT_POLL_MS\)/.test(source), true)
check('polling is gated on the Session gate', /if \(!ready\) return[\s\S]{0,400}setInterval\(/.test(source), true)
check('polling stops when the tab is hidden', /visibilityState/.test(source), true)
check('the initial load runs only once the Session is open', /if \(!ready\) return[\s\S]{0,160}reload\(\)/.test(source), true)

console.log(failures === 0 ? '\ngit freshness contract passed' : `\n${failures} check(s) failed`)
process.exitCode = failures === 0 ? 0 : 1
