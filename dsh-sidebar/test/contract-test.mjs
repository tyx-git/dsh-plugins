/**
 * Contract checks for the host half's pure helpers. Run with the bundled Node:
 *   node test/contract-test.mjs
 */
import {
  anchor,
  BRANCH_FORMAT,
  commitPlan,
  describeEntries,
  LOG_FORMAT,
  parseBranches,
  parseLog,
  parseStatus,
} from '../index.js'

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

// ── commit action plan ─────────────────────────────────────────────────────
// User-facing oracle: the all-changes commit button must include newly created
// files; `git commit -a` does not. Staged-only commits must preserve the index.
check('all-changes commit stages untracked files before committing', commitPlan('add new file', true), [
  ['add', '-A'],
  ['commit', '-m', 'add new file'],
])
check('staged-only commit leaves the index untouched', commitPlan('commit staged', false), [
  ['commit', '-m', 'commit staged'],
])

// ── porcelain v1 -z parsing ────────────────────────────────────────────────
const tracked = parseStatus(
  [
    '## main...origin/main [ahead 2, behind 1]',
    ' M src/a.ts',
    'M  src/b.ts',
    'A  src/c.ts',
    '?? notes.md',
    // git prints the new path first, then the original, in `-z` rename pairs.
    'R  src/new.ts',
    'src/old.ts',
  ].join('\u0000') + '\u0000',
)
check('branch', tracked.branch, 'main')
check('upstream', tracked.upstream, 'origin/main')
check('ahead', tracked.ahead, 2)
check('behind', tracked.behind, 1)
check('born', tracked.born, true)
check('entry count (rename pair consumed)', tracked.entries.length, 5)
check('worktree modification', tracked.entries[0], { path: 'src/a.ts', index: ' ', worktree: 'M' })
check('untracked', tracked.entries[3], { path: 'notes.md', index: '?', worktree: '?' })
check('rename keeps the new path', tracked.entries[4], { path: 'src/new.ts', index: 'R', worktree: ' ' })

const detached = parseStatus('## HEAD (no branch)\u0000')
check('detached has no branch', detached.branch, '')
check('detached flag', detached.detached, true)

const unborn = parseStatus('## No commits yet on main\u0000A  first.txt\u0000')
check('unborn branch name', unborn.branch, 'main')
check('unborn flag', unborn.born, false)

const noUpstream = parseStatus('## feature/x\u0000 M one.txt\u0000')
check('branch without upstream', noUpstream.branch, 'feature/x')
check('no upstream name', noUpstream.upstream, '')

// ── XY pair to the rows the panel groups ───────────────────────────────────
check('untracked row', describeEntries({ path: 'a', index: '?', worktree: '?' }), [
  { path: 'a', kind: 'untracked', code: 'U', staged: false },
])
check('staged add', describeEntries({ path: 'a', index: 'A', worktree: ' ' }), [
  { path: 'a', kind: 'added', code: 'A', staged: true },
])
check('staged modify', describeEntries({ path: 'a', index: 'M', worktree: ' ' }), [
  { path: 'a', kind: 'modified', code: 'M', staged: true },
])
check('unstaged modify', describeEntries({ path: 'a', index: ' ', worktree: 'M' }), [
  { path: 'a', kind: 'modified', code: 'M', staged: false },
])
check('staged and modified again reports twice', describeEntries({ path: 'a', index: 'M', worktree: 'M' }), [
  { path: 'a', kind: 'modified', code: 'M', staged: true },
  { path: 'a', kind: 'modified', code: 'M', staged: false },
])
check('worktree delete', describeEntries({ path: 'a', index: ' ', worktree: 'D' }), [
  { path: 'a', kind: 'deleted', code: 'D', staged: false },
])
check('conflict', describeEntries({ path: 'a', index: 'U', worktree: 'U' }), [
  { path: 'a', kind: 'conflict', code: '!', staged: false },
])

// ── git log / branch decoding ──────────────────────────────────────────────
const LOG = [
  'a71a77a\u001f652aa69\u001ftester\u001f0 seconds ago\u001fSat Oct 31 14:22:33 2026 +0800\u001fsecond commit with 中文',
  '652aa69\u001f\u001ftester\u001f1 second ago\u001fSat Oct 31 14:22:32 2026 +0800\u001ffirst commit',
].join('\n')
const commits = parseLog(LOG)
check('log rows', commits.length, 2)
check('log head commit', commits[0], {
  hash: 'a71a77a',
  parents: ['652aa69'],
  author: 'tester',
  when: '0 seconds ago',
  date: 'Sat Oct 31 14:22:33 2026 +0800',
  subject: 'second commit with 中文',
})
check('root commit has no parents', commits[1].parents, [])
check('branch rows', parseBranches('master\t*\nfeature/x\t\n'), [
  { name: 'master', current: true },
  { name: 'feature/x', current: false },
])

// ── argv the routes actually spawn ─────────────────────────────────────────
// Symptom this reproduces: the commit graph and the branch menu were empty. A
// raw NUL in argv makes execFile throw before git runs, so /git/log and
// /git/branches answered 500 and the client fell back to empty lists.
//
// The file sandbox denies spawning (EPERM), so the argv contract is asserted
// directly instead of by calling execFile: Node rejects any argv element that
// contains a NUL byte, before the process is created.
const hasNulByte = (value) => value.includes('\u0000')
check('git log format has no NUL byte', hasNulByte(LOG_FORMAT), false)
check('git branch format has no NUL byte', hasNulByte(BRANCH_FORMAT), false)

// ── path containment ───────────────────────────────────────────────────────
const root = 'F:\\Software\\DSH\\Chat'
check('root itself', anchor(root, ''), root)
check('child', anchor(root, 'dsh-sidebar/client.js'), 'F:\\Software\\DSH\\Chat\\dsh-sidebar\\client.js')
check('parent escape', anchor(root, '../secret.txt'), undefined)
check('deep escape', anchor(root, 'a/../../secret.txt'), undefined)
check('absolute outside', anchor(root, 'C:\\Windows\\win.ini'), undefined)
// A leading separator makes the value absolute, and an absolute path is never
// silently re-anchored: it is refused rather than resolved against the root.
check('leading separator is refused', anchor(root, '/dsh-sidebar'), undefined)
check('absolute inside is allowed', anchor(root, `${root}\\dsh-sidebar`), `${root}\\dsh-sidebar`)

console.log(failures === 0 ? '\nall contract checks passed' : `\n${failures} check(s) failed`)
process.exitCode = failures === 0 ? 0 : 1
