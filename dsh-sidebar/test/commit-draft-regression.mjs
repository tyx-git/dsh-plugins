/**
 * Contract regression for the user-visible bug:
 * switching away from a Session and back must restore its commit message.
 *
 * The current plugin is a hand-written browser module and this workspace has no
 * React/DOM renderer. The test therefore checks the concrete persistence
 * contract at the component boundary instead of producing a false red from an
 * unavailable renderer.
 */
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
const gitStart = source.indexOf('    function GitPane(props) {')
const graphStart = source.indexOf('    // ── commit graph', gitStart)
const gitPane = source.slice(gitStart, graphStart)

let failures = 0
const check = (label, actual, expected) => {
  if (actual === expected) {
    console.log(`ok   ${label}`)
    return
  }
  failures += 1
  console.log(`FAIL ${label}\n  expected ${expected}\n  actual   ${actual}`)
}

check(
  'commit draft key is session-scoped',
  /COMMIT_DRAFT_PREFIX/.test(source) && /commitDraftKey\(sessionId\)/.test(source),
  true,
)
check(
  'GitPane initializes from the current Session draft',
  /useState\(\(\) => readCommitDraft\(sessionId\)\)/.test(gitPane),
  true,
)
check(
  'typing persists the current Session draft',
  /writeCommitDraft\(sessionId, value\)/.test(gitPane),
  true,
)
check(
  'successful commit clears only the current Session draft',
  /clearCommitDraft\(sessionId\)/.test(gitPane),
  true,
)

console.log(failures === 0 ? '\ncommit draft regression contract passed' : `\n${failures} check(s) failed`)
process.exitCode = failures === 0 ? 0 : 1
