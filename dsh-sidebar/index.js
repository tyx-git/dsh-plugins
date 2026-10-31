/**
 * dsh-sidebar — host half.
 *
 * One JSON endpoint family under `/dsh-sidebar`, owned by this plugin's own
 * effect, that the browser half calls with plain `fetch`:
 *
 *   GET  /dsh-sidebar/git?sessionId=            branch, upstream, ahead/behind, changes
 *   GET  /dsh-sidebar/git/log?sessionId&limit   recent commits with their parents
 *   GET  /dsh-sidebar/git/branches?sessionId=   local branches
 *   GET  /dsh-sidebar/git/diff?sessionId&path&staged
 *   POST /dsh-sidebar/git                       init | stage | unstage | discard | commit |
 *                                               push | pull | fetch | checkout | createBranch
 *   GET  /dsh-sidebar/notes?sessionId=          the session's scratch notes
 *   POST /dsh-sidebar/notes                     replace them
 *
 * Two rules keep it honest: a file path is re-anchored on the Session's working
 * directory and refused when it escapes, and a request whose `Origin` names
 * another host is refused (the page is same-origin, so a foreign Origin means
 * another document drove the call).
 */

import { execFile } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, isAbsolute, join, resolve, sep } from 'node:path'

export const name = 'dsh-sidebar'

const ROUTE = '/dsh-sidebar'
const BODY_LIMIT = 1024 * 1024
const GIT_TIMEOUT = 30_000
const MAX_DIFF_BYTES = 400_000

/** `$DSH_HOME`, or the home-directory default the harness uses. */
function dshHome() {
  const configured = process.env.DSH_HOME?.trim()
  if (configured) return configured
  const profile = process.env.DSH_PROFILE?.trim()
  if (profile) return join(homedir(), '.dsh', 'profiles', profile)
  return join(homedir(), '.dsh')
}

/** Notes live beside the profile, never inside a user workspace. */
function notesFile() {
  return join(dshHome(), 'dsh-sidebar', 'notes.json')
}

function readNotes() {
  try {
    const raw = readFileSync(notesFile(), 'utf8')
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeNotes(all) {
  const file = notesFile()
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, `${JSON.stringify(all, null, 2)}\n`, 'utf8')
}

/** Send one JSON body; every response is `no-store` because each read is live state. */
function send(response, status, body) {
  const text = JSON.stringify(body)
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(text),
  })
  response.end(text)
}

function readBody(request) {
  return new Promise((resolveBody, rejectBody) => {
    let data = ''
    request.on('data', (chunk) => {
      data += chunk
      if (data.length > BODY_LIMIT) {
        rejectBody(new Error('body too large'))
        request.destroy()
      }
    })
    request.on('end', () => resolveBody(data))
    request.on('error', rejectBody)
  })
}

/**
 * Re-anchor a caller-supplied relative path on `root`.
 * @returns the absolute path, or `undefined` when it escapes the root.
 */
function anchor(root, relative) {
  const base = resolve(root)
  const wanted = relative === undefined || relative === null || relative === '' ? '' : String(relative)
  const target = resolve(base, wanted.replace(/^[\\/]+/, ''))
  if (isAbsolute(wanted) && resolve(wanted) !== target) return undefined
  const loweredBase = process.platform === 'win32' ? base.toLowerCase() : base
  const loweredTarget = process.platform === 'win32' ? target.toLowerCase() : target
  if (loweredTarget === loweredBase) return target
  const prefix = loweredBase.endsWith(sep) ? loweredBase : `${loweredBase}${sep}`
  return loweredTarget.startsWith(prefix) ? target : undefined
}

/**
 * Field separators travel through argv, where a raw NUL is rejected before any
 * process starts; `%x1f` is the escape git expands into the same separator.
 */
const LOG_FORMAT = '%h%x1f%p%x1f%an%x1f%ar%x1f%ad%x1f%s'
const BRANCH_FORMAT = '%(refname:short)\t%(HEAD)'

/** One `git` invocation; reports what happened in one result shape. */
function git(cwd, args, timeout = GIT_TIMEOUT) {
  return new Promise((resolveRun) => {
    execFile(
      'git',
      args,
      {
        cwd,
        windowsHide: true,
        maxBuffer: 16 * 1024 * 1024,
        timeout,
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_OPTIONAL_LOCKS: '0' },
      },
      (error, stdout, stderr) => {
        resolveRun({
          ok: error === null || error === undefined,
          code: typeof error?.code === 'number' ? error.code : error === null ? 0 : 1,
          missing: error?.code === 'ENOENT',
          killed: error?.killed === true,
          stdout: String(stdout ?? ''),
          stderr: String(stderr ?? ''),
        })
      },
    )
  })
}

/** Split porcelain v1 `-z` output into entries, tolerating rename pairs. */
function parseStatus(raw) {
  const chunks = raw.split('\u0000')
  let branch = ''
  let upstream = ''
  let ahead = 0
  let behind = 0
  let detached = false
  let born = true
  const entries = []
  let index = 0
  if (chunks[0]?.startsWith('## ')) {
    const header = chunks[0].slice(3)
    index = 1
    const tracking = header.match(/^(.*?)\.\.\.(\S+)(?:\s\[(.*)\])?$/)
    if (tracking) {
      branch = tracking[1]
      upstream = tracking[2]
      const counts = tracking[3] ?? ''
      ahead = Number(counts.match(/ahead (\d+)/)?.[1] ?? 0)
      behind = Number(counts.match(/behind (\d+)/)?.[1] ?? 0)
    } else if (/^HEAD\b/.test(header)) {
      // `## HEAD (no branch)` is a detached HEAD: there is no branch name to show.
      detached = true
    } else if (header.startsWith('No commits yet on ')) {
      // A freshly initialised repository names the unborn branch after the prefix.
      branch = header.slice('No commits yet on '.length)
      born = false
    } else {
      branch = header.replace(/\s\[.*\]$/, '')
    }
  }
  for (; index < chunks.length; index += 1) {
    const chunk = chunks[index]
    if (chunk.length < 4) continue
    const x = chunk[0]
    const y = chunk[1]
    const path = chunk.slice(3)
    if (x === 'R' || x === 'C') index += 1
    entries.push({ path, index: x, worktree: y })
  }
  return { branch, upstream, ahead, behind, detached, born, entries }
}

/**
 * Split one `git log` run into commit records.
 *
 * Fields arrive unit-separated (`%x1f`): a raw NUL cannot travel through argv,
 * and a printable separator keeps subjects with spaces or tabs intact.
 */
function parseLog(raw) {
  return raw
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const [hash, parents, author, when, date, subject] = line.split('\u001f')
      return {
        hash,
        parents: parents ? parents.split(' ').filter(Boolean) : [],
        author,
        when,
        date,
        subject,
      }
    })
}

/** Split `git branch --format=%(refname:short)\t%(HEAD)` into branch records. */
function parseBranches(raw) {
  return raw
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const [name, head] = line.split('\t')
      return { name, current: head?.trim() === '*' }
    })
}

/** Porcelain's single status letter as the badge kind the panel colours. */
function kindOf(letter) {
  switch (letter) {
    case 'A':
      return 'added'
    case 'D':
      return 'deleted'
    case 'R':
      return 'renamed'
    case 'C':
      return 'copied'
    case 'T':
      return 'typechange'
    default:
      return 'modified'
  }
}

/**
 * One porcelain entry as the rows the panel lists.
 *
 * A file that is staged *and* modified again reports twice, exactly as the
 * panel groups them: once under "staged", once under "changes".
 */
function describeEntries(entry) {
  const { index, worktree, path } = entry
  if (index === '?' && worktree === '?') {
    return [{ path, kind: 'untracked', code: 'U', staged: false }]
  }
  if (index === 'U' || worktree === 'U' || (index === 'A' && worktree === 'A') || (index === 'D' && worktree === 'D')) {
    return [{ path, kind: 'conflict', code: '!', staged: false }]
  }
  const rows = []
  if (index !== ' ' && index !== '?') {
    rows.push({ path, kind: kindOf(index), code: index, staged: true })
  }
  if (worktree !== ' ' && worktree !== '?') {
    rows.push({ path, kind: kindOf(worktree), code: worktree, staged: false })
  }
  return rows
}

/**
 * Mount the endpoint family on the web server.
 * @param ctx - plugin context; `sessions` and `workingDirectory` are read optionally.
 * @param webServer - the browser HTTP carrier.
 */
/**
 * Build the Git command plan for the UI's commit action.
 * `all` must include untracked worktree files as well as tracked edits.
 */
function commitPlan(message, all) {
  return all
    ? [['add', '-A'], ['commit', '-m', message]]
    : [['commit', '-m', message]]
}

function registerRoutes(ctx, webServer) {
  if (!webServer || typeof webServer.register !== 'function') {
    ctx.logger?.warn?.('dsh-sidebar: webServer is unavailable; the sidebar cannot read or write')
    return
  }

  /** Resolve a Session's effective working directory without assuming the services exist. */
  const cwdFor = (sessionId) => {
    const sessions = ctx.get?.('sessions')
    const session = sessionId ? sessions?.get?.(sessionId) : undefined
    const fromHeader = session?.header?.cwd
    if (typeof fromHeader === 'string' && fromHeader.length > 0) return resolve(fromHeader)
    const workingDirectory = ctx.get?.('workingDirectory')
    if (session && typeof workingDirectory?.get === 'function') {
      try {
        const path = workingDirectory.get(session)
        if (typeof path === 'string' && path.length > 0) return resolve(path)
      } catch {
        // a Session without an admitted directory falls through to the default
      }
    }
    if (typeof workingDirectory?.defaultDirectory === 'string' && workingDirectory.defaultDirectory.length > 0) {
      return resolve(workingDirectory.defaultDirectory)
    }
    return resolve(process.cwd())
  }

  const originAllowed = (request) => {
    const origin = request.headers.origin
    if (typeof origin !== 'string' || origin.length === 0) return true
    try {
      return new URL(origin).host === request.headers.host
    } catch {
      return false
    }
  }

  const handlers = {
    '/git': async (request, response, url) => {
      const cwd = cwdFor(url.searchParams.get('sessionId') ?? undefined)
      const status = await git(cwd, ['status', '--porcelain=v1', '-b', '-z', '-uall'])
      if (status.missing) {
        send(response, 200, { ok: false, reason: 'git-missing', cwd })
        return
      }
      if (!status.ok) {
        const notRepo = /not a git repository/i.test(status.stderr)
        send(response, 200, { ok: false, reason: notRepo ? 'no-repo' : 'failed', cwd, message: status.stderr.trim() })
        return
      }
      const parsed = parseStatus(status.stdout)
      const top = await git(cwd, ['rev-parse', '--show-toplevel'], 8000)
      const head = await git(cwd, ['rev-parse', '--verify', 'HEAD'], 8000)
      const files = parsed.entries.flatMap((entry) => describeEntries(entry))
      send(response, 200, {
        ok: true,
        cwd,
        root: top.ok ? top.stdout.trim() : cwd,
        branch: parsed.branch || (parsed.detached ? 'HEAD' : ''),
        upstream: parsed.upstream,
        detached: parsed.detached,
        born: parsed.born && head.ok,
        ahead: parsed.ahead,
        behind: parsed.behind,
        files,
        staged: files.filter((file) => file.staged).length,
        dirty: files.length,
      })
    },

    '/git/log': async (request, response, url) => {
      const cwd = cwdFor(url.searchParams.get('sessionId') ?? undefined)
      const limit = Math.min(60, Math.max(1, Number(url.searchParams.get('limit') ?? 30) || 30))
      const run = await git(cwd, ['log', `-n${limit}`, '--date=short', `--pretty=format:${LOG_FORMAT}`])
      if (!run.ok) {
        // A repository with no commit yet makes `git log` fail. That is the normal
        // empty state, not an error, and git's raw stderr must not reach the UI.
        const head = await git(cwd, ['rev-parse', '--verify', '--quiet', 'HEAD'], 8000)
        send(
          response,
          200,
          head.ok
            ? { ok: false, reason: 'failed', commits: [], message: run.stderr.trim().slice(0, 300) }
            : { ok: false, reason: 'no-commits', commits: [] },
        )
        return
      }
      send(response, 200, { ok: true, commits: parseLog(run.stdout) })
    },

    '/git/branches': async (request, response, url) => {
      const cwd = cwdFor(url.searchParams.get('sessionId') ?? undefined)
      const run = await git(cwd, ['branch', `--format=${BRANCH_FORMAT}`], 8000)
      if (!run.ok) {
        send(response, 200, { ok: false, branches: [] })
        return
      }
      send(response, 200, { ok: true, branches: parseBranches(run.stdout) })
    },

    '/git/diff': async (request, response, url) => {
      const cwd = cwdFor(url.searchParams.get('sessionId') ?? undefined)
      const relative = url.searchParams.get('path') ?? ''
      const staged = url.searchParams.get('staged') === '1'
      const target = anchor(cwd, relative)
      if (target === undefined) {
        send(response, 403, { error: 'outside-workspace' })
        return
      }
      const args = ['diff', '--no-color', '--unified=2']
      if (staged) args.push('--cached')
      args.push('--', relative)
      const run = await git(cwd, args, 15000)
      send(response, 200, { ok: run.ok, diff: run.stdout.slice(0, MAX_DIFF_BYTES), truncated: run.stdout.length > MAX_DIFF_BYTES })
    },

    '/notes': async (request, response, url) => {
      if (request.method === 'GET') {
        const sessionId = url.searchParams.get('sessionId') ?? ''
        const all = readNotes()
        const record = sessionId ? all[sessionId] : undefined
        send(response, 200, {
          ok: true,
          text: typeof record?.text === 'string' ? record.text : '',
          updatedAt: record?.updatedAt ?? null,
        })
        return
      }
      if (request.method !== 'POST') {
        response.writeHead(405, { allow: 'GET, POST' })
        response.end()
        return
      }
      try {
        const body = JSON.parse(await readBody(request))
        const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : ''
        if (!sessionId) {
          send(response, 400, { ok: false, error: 'sessionId required' })
          return
        }
        const text = typeof body?.text === 'string' ? body.text.slice(0, 200_000) : ''
        const all = readNotes()
        const updatedAt = new Date().toISOString()
        if (text.length === 0) delete all[sessionId]
        else all[sessionId] = { text, updatedAt }
        writeNotes(all)
        send(response, 200, { ok: true, updatedAt })
      } catch (error) {
        send(response, 400, { ok: false, error: String(error?.message ?? error) })
      }
    },
  }

  /** Write actions share one endpoint; each maps to an explicit argument list. */
  const writeActions = {
    init: async (cwd) => git(cwd, ['init'], 30_000),
    stage: async (cwd, body) => {
      const paths = (Array.isArray(body?.paths) ? body.paths : []).filter((path) => typeof path === 'string' && path.length > 0)
      if (paths.length === 0) return { ok: false, error: 'no paths' }
      return git(cwd, ['add', '--', ...paths])
    },
    unstage: async (cwd, body) => {
      const paths = (Array.isArray(body?.paths) ? body.paths : []).filter((path) => typeof path === 'string' && path.length > 0)
      if (paths.length === 0) return { ok: false, error: 'no paths' }
      const head = await git(cwd, ['rev-parse', '--verify', 'HEAD'], 8000)
      return head.ok
        ? git(cwd, ['reset', '-q', 'HEAD', '--', ...paths])
        : git(cwd, ['rm', '--cached', '-r', '--', ...paths])
    },
    discard: async (cwd, body) => {
      const paths = (Array.isArray(body?.paths) ? body.paths : []).filter((path) => typeof path === 'string' && path.length > 0)
      if (paths.length === 0) return { ok: false, error: 'no paths' }
      const untracked = (Array.isArray(body?.untracked) ? body.untracked : []).filter((path) => typeof path === 'string' && path.length > 0)
      const restore = await git(cwd, ['restore', '--worktree', '--', ...paths])
      const clean = untracked.length === 0 ? { ok: true, stdout: '', stderr: '' } : await git(cwd, ['clean', '-f', '--', ...untracked])
      return {
        ok: restore.ok && clean.ok,
        stdout: `${restore.stdout}${clean.stdout}`,
        stderr: `${restore.stderr}${clean.stderr}`,
      }
    },
    commit: async (cwd, body) => {
      const message = typeof body?.message === 'string' ? body.message.trim() : ''
      if (message.length === 0) return { ok: false, error: 'message required' }
      let result
      for (const [command, ...args] of commitPlan(message, body?.all === true)) {
        result = await git(cwd, [command, ...args], 60_000)
        if (!result.ok) return result
      }
      return result
    },
    push: async (cwd, body) => {
      const args = ['push']
      if (body?.setUpstream === true) args.push('--set-upstream', 'origin', 'HEAD')
      return git(cwd, args, 120_000)
    },
    pull: async (cwd) => git(cwd, ['pull', '--no-rebase'], 120_000),
    fetch: async (cwd) => git(cwd, ['fetch', '--all', '--prune'], 120_000),
    checkout: async (cwd, body) => {
      const branch = typeof body?.branch === 'string' ? body.branch.trim() : ''
      if (!branch) return { ok: false, error: 'branch required' }
      if (branch.startsWith('-')) return { ok: false, error: 'invalid branch' }
      return git(cwd, ['checkout', branch], 60_000)
    },
    createBranch: async (cwd, body) => {
      const branch = typeof body?.branch === 'string' ? body.branch.trim() : ''
      if (!branch) return { ok: false, error: 'branch required' }
      if (branch.startsWith('-') || /\s/.test(branch)) return { ok: false, error: 'invalid branch' }
      return git(cwd, ['checkout', '-b', branch], 60_000)
    },
  }

  const handler = async (request, response) => {
    if (!originAllowed(request)) {
      send(response, 403, { error: 'forbidden-origin' })
      return
    }
    let url
    try {
      url = new URL(request.url ?? '/', 'http://localhost')
    } catch {
      send(response, 400, { error: 'bad-url' })
      return
    }
    const path = url.pathname.slice(ROUTE.length) || '/'
    try {
      if (path === '/git' && request.method === 'POST') {
        const body = JSON.parse((await readBody(request)) || '{}')
        const action = writeActions[body?.action]
        if (!action) {
          send(response, 400, { ok: false, error: `unknown action "${String(body?.action)}"` })
          return
        }
        const cwd = cwdFor(typeof body?.sessionId === 'string' ? body.sessionId : undefined)
        const result = await action(cwd, body)
        send(response, 200, {
          ok: result.ok === true,
          stdout: String(result.stdout ?? '').slice(0, 20_000),
          stderr: String(result.stderr ?? '').slice(0, 20_000),
          error: result.error ?? null,
        })
        return
      }
      const read = handlers[path]
      if (!read) {
        send(response, 404, { error: 'not-found' })
        return
      }
      if (request.method !== 'GET' && !(path === '/notes' && request.method === 'POST')) {
        response.writeHead(405, { allow: 'GET, POST' })
        response.end()
        return
      }
      await read(request, response, url)
    } catch (error) {
      try {
        send(response, 500, { error: String(error?.message ?? error) })
      } catch {
        // the socket is already gone; nothing left to report to
      }
    }
  }

  ctx.effect(() => webServer.register({ kind: 'prefix', path: ROUTE, handler }), 'dsh-sidebar: endpoint family')
}

/**
 * Activate the host half. `webServer` may mount after this row, so wait for it
 * instead of reading it once.
 * @param ctx - plugin context.
 */
export function apply(ctx) {
  const install = (scope) => {
    try {
      registerRoutes(scope, scope.get?.('webServer') ?? ctx.get?.('webServer'))
    } catch (error) {
      ctx.logger?.warn?.('dsh-sidebar: route registration failed: %s', String(error?.stack ?? error))
    }
  }
  if (typeof ctx.inject === 'function') ctx.inject(['webServer'], install)
  else install(ctx)
}

// Pure helpers and the argv templates they decode, exported so their contracts
// stay testable outside the server.
export { anchor, BRANCH_FORMAT, commitPlan, describeEntries, LOG_FORMAT, parseBranches, parseLog, parseStatus }
