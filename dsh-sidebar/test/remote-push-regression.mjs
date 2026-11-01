/**
 * Contract for the push flow and the remote indicator.
 *
 * Acceptance:
 *  1. no remote + push → ask for a URL, add it as `origin`, push with upstream;
 *  2. remote + push → plain push, adding upstream only when the branch has none;
 *  3. the remote's repository name sits at the right end of the push row;
 *  4. no remote → no name, and an invalid URL is refused.
 */
import { readFileSync } from 'node:fs'
import * as host from '../index.js'

const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8')

let entry
const fakeWindow = {
  __ModuleLoader__: { load: (value) => { entry = value } },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  setTimeout: (fn) => { fn(); return 1 },
  clearTimeout: () => {},
}
new Function('window', source)(fakeWindow)
const clientApi = entry.factory(() => ({ createElement: () => null, Component: class {} })).__test ?? {}

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

// ── 1. repository name derived from the remote URL ─────────────────────────
const repoName = host.remoteRepoName ?? (() => 'not-implemented')
check('https .git URL', repoName('https://github.com/acme/widgets.git'), 'widgets')
check('scp-like URL', repoName('git@github.com:acme/widgets.git'), 'widgets')
check('URL without .git', repoName('https://gitlab.com/group/sub/repo'), 'repo')
check('trailing slash', repoName('https://example.com/acme/widgets.git/'), 'widgets')
check('empty URL', repoName(''), '')

// ── 2. push plan: ask, add, then push with upstream ───────────────────────
const plan = host.pushPlan ?? (() => 'not-implemented')
check('established upstream pushes plainly', plan({ url: '', hasRemote: true, upstream: 'origin/main' }), [
  ['push'],
])
check('missing upstream is set on first push', plan({ url: '', hasRemote: true, upstream: '' }), [
  ['push', '--set-upstream', 'origin', 'HEAD'],
])
check('a supplied URL becomes origin, then the first push', plan({ url: 'https://host/acme/app.git', hasRemote: false, upstream: '' }), [
  ['remote', 'add', 'origin', 'https://host/acme/app.git'],
  ['push', '--set-upstream', 'origin', 'HEAD'],
])
check('an empty URL without a remote is refused', plan({ url: '', hasRemote: false, upstream: '' }), null)
check('an option-looking URL is refused', plan({ url: '--upload-pack=evil', hasRemote: false, upstream: '' }), null)

// ── 3. the pane asks only when there is no remote ─────────────────────────
const needsPrompt = clientApi.needsRemotePrompt ?? (() => 'not-implemented')
check('a repository without a remote asks for one', needsPrompt({ ok: true, remote: null }), true)
check('a repository with a remote pushes directly', needsPrompt({ ok: true, remote: { name: 'origin' } }), false)
check('a non-repository never asks', needsPrompt({ ok: false, reason: 'no-repo' }), false)
check('an unloaded status never asks', needsPrompt(null), false)

// ── 4. wiring: the name is rendered at the row's right end ────────────────
check('the actions row renders the remote name', /dshsb-remote/.test(source), true)
check('the push flow can collect a URL', /remoteUrl/.test(source), true)

console.log(failures === 0 ? '\nremote push contract passed' : `\n${failures} check(s) failed`)
process.exitCode = failures === 0 ? 0 : 1
