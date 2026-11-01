/**
 * dsh-sidebar — browser half.
 *
 * One right-column tab type (`dsh-sidebar`) whose body is a workbench of
 * resizable panes: session notes, the git working tree, the commit graph and a
 * built-in browser with its own page strip.
 *
 * Hand-written in the browser module format: no build step, React from the
 * module table, every colour a `--dsw-alias-*` token so light and dark both
 * work. Data comes from the host half's `/dsh-sidebar` routes.
 */
window.__ModuleLoader__.load({
  id: 'dsh-sidebar',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const NS = 'dshSidebar'
    const KIND = 'dsh-sidebar'
    const ID = 'dsh-sidebar.panel'
    const ENDPOINT = '/dsh-sidebar'
    const SIZES_KEY = 'dsh-sidebar:sizes:v1'
    /** Workspace edits must show up on their own; one cheap status probe per tick. */
    const GIT_POLL_MS = 2000

    // ── copy ────────────────────────────────────────────────────────────────
    const zh = {
      'tab.title': '侧栏',
      'guide.title': '侧栏工作台',
      'guide.description': '笔记、Git 与浏览器',
      'top.workbench': '工作台',
      'top.browser': '浏览器',
      'common.refresh': '刷新',
      'common.retry': '重试',
      'notes.title': '笔记',
      'notes.placeholder': '记下这个会话的临时想法、命令、待办…',
      'notes.saving': '保存中',
      'notes.saved': '已保存',
      'notes.dirty': '未保存',
      'notes.error': '保存失败',
      'notes.chars': '{n} 字',
      'git.title': 'Git',
      'git.loading': '读取仓库…',
      'git.notRepo': '当前目录还不是 Git 仓库',
      'git.notRepoHint': '初始化之后，改动、提交与推送都在这里。',
      'git.init': '初始化仓库',
      'git.initializing': '正在初始化…',
      'git.gitMissing': '没有找到 git 命令',
      'git.gitMissingHint': '请安装 Git，并确保它在 PATH 中。',
      'git.failed': 'Git 读取失败',
      'git.staged': '暂存的更改',
      'git.changes': '更改',
      'git.untracked': '未跟踪',
      'git.clean': '没有未提交的改动',
      'git.stage': '暂存',
      'git.unstage': '取消暂存',
      'git.stageAll': '全部暂存',
      'git.unstageAll': '全部取消暂存',
      'git.discard': '放弃改动',
      'git.confirmDiscard': '放弃这些文件的改动？此操作无法撤销。',
      'git.diff': '查看差异',
      'git.diffMore': '… 还有 {n} 行',
      'git.commitPlaceholder': '提交信息',
      'git.commitHint': '提交（Ctrl+Enter）',
      'git.commit': '提交',
      'git.ahead': '领先 {n}',
      'git.behind': '落后 {n}',
      'git.push': '推送',
      'git.pull': '拉取',
      'git.fetch': '获取',
      'git.branchSwitch': '切换分支',
      'git.branchNew': '新建分支',
      'git.branchNewPlaceholder': '新分支名',
      'git.branchCreate': '创建并切换',
      'git.noBranches': '还没有分支',
      'git.done': '已完成',
      'git.failedAction': '操作失败',
      'history.title': '图表',
      'history.empty': '当前无提交',
      'history.merge': '合并提交',
      'history.files': '{n} 个文件',
      'history.binary': '二进制文件',
      'browser.title': '浏览器',
      'browser.placeholder': '输入地址，如 localhost:3000',
      'browser.go': '前往',
      'browser.reload': '刷新',
      'browser.newTab': '新建标签页',
      'browser.closeTab': '关闭',
      'browser.empty': '输入地址开始浏览',
      'browser.hint': '部分站点通过 X-Frame-Options 禁止被嵌入，会显示空白。',
    }
    const en = {
      'tab.title': 'Sidebar',
      'guide.title': 'Sidebar workbench',
      'guide.description': 'Notes, git and a browser',
      'top.workbench': 'Workbench',
      'top.browser': 'Browser',
      'common.refresh': 'Refresh',
      'common.retry': 'Retry',
      'notes.title': 'Notes',
      'notes.placeholder': 'Scratch space for this session: ideas, commands, todos…',
      'notes.saving': 'Saving',
      'notes.saved': 'Saved',
      'notes.dirty': 'Unsaved',
      'notes.error': 'Save failed',
      'notes.chars': '{n} chars',
      'git.title': 'Git',
      'git.loading': 'Reading the repository…',
      'git.notRepo': 'This folder is not a git repository yet',
      'git.notRepoHint': 'Initialise it and changes, commits and pushes all live here.',
      'git.init': 'Initialise repository',
      'git.initializing': 'Initialising…',
      'git.gitMissing': 'The git command was not found',
      'git.gitMissingHint': 'Install Git and make sure it is on PATH.',
      'git.failed': 'Could not read git state',
      'git.staged': 'Staged changes',
      'git.changes': 'Changes',
      'git.untracked': 'Untracked',
      'git.clean': 'Nothing uncommitted',
      'git.stage': 'Stage',
      'git.unstage': 'Unstage',
      'git.stageAll': 'Stage all',
      'git.unstageAll': 'Unstage all',
      'git.discard': 'Discard changes',
      'git.confirmDiscard': 'Discard the changes in these files? This cannot be undone.',
      'git.diff': 'Show diff',
      'git.diffMore': '… {n} more lines',
      'git.commitPlaceholder': 'Commit message',
      'git.commitHint': 'Commit (Ctrl+Enter)',
      'git.commit': 'Commit',
      'git.ahead': '{n} ahead',
      'git.behind': '{n} behind',
      'git.push': 'Push',
      'git.pull': 'Pull',
      'git.fetch': 'Fetch',
      'git.branchSwitch': 'Switch branch',
      'git.branchNew': 'New branch',
      'git.branchNewPlaceholder': 'New branch name',
      'git.branchCreate': 'Create and switch',
      'git.noBranches': 'No branches yet',
      'git.done': 'Done',
      'git.failedAction': 'Action failed',
      'history.title': 'Graph',
      'history.empty': 'No commits',
      'history.merge': 'Merge commit',
      'history.files': '{n} files',
      'history.binary': 'binary file',
      'browser.title': 'Browser',
      'browser.placeholder': 'Enter an address, for example localhost:3000',
      'browser.go': 'Go',
      'browser.reload': 'Reload',
      'browser.newTab': 'New tab',
      'browser.closeTab': 'Close',
      'browser.empty': 'Enter an address to start browsing',
      'browser.hint': 'Some sites refuse embedding through X-Frame-Options and stay blank.',
    }

    // ── transport ───────────────────────────────────────────────────────────
    const enc = (value) => encodeURIComponent(String(value ?? ''))

    async function call(path, init) {
      const response = await fetch(`${ENDPOINT}${path}`, { cache: 'no-store', ...init })
      const text = await response.text()
      if (!response.ok) throw new Error(`HTTP ${response.status}${text ? ` · ${text.slice(0, 120)}` : ''}`)
      if (!text) return null
      return JSON.parse(text)
    }

    const postJson = (path, body) =>
      call(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body ?? {}) })

    const api = {
      status: (sessionId) => call(`/git?sessionId=${enc(sessionId)}`),
      log: (sessionId) => call(`/git/log?sessionId=${enc(sessionId)}&limit=40`),
      branches: (sessionId) => call(`/git/branches?sessionId=${enc(sessionId)}`),
      diff: (sessionId, path, staged) =>
        call(`/git/diff?sessionId=${enc(sessionId)}&path=${enc(path)}&staged=${staged ? '1' : '0'}`),
      notes: (sessionId) => call(`/notes?sessionId=${enc(sessionId)}`),
      saveNotes: (sessionId, text) => postJson('/notes', { sessionId, text }),
      git: (sessionId, action, extra) => postJson('/git', { sessionId, action, ...(extra ?? {}) }),
    }

    // ── artwork ─────────────────────────────────────────────────────────────
    const svg = (props, children) =>
      h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: props.size ?? 14,
          height: props.size ?? 14,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.25,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
          style: { display: 'block', flex: 'none', ...(props.style ?? {}) },
        },
        children,
      )

    const Glyph = {
      note: (p) =>
        svg(p, [
          h('path', { key: 'a', d: 'M3.6 2.6h5.9l3 3v7.8H3.6z' }),
          h('path', { key: 'b', d: 'M9.3 2.7v3.1h3.1' }),
          h('path', { key: 'c', d: 'M5.6 8.3h4.8M5.6 10.6h3.2' }),
        ]),
      file: (p) =>
        svg(p, [
          h('path', { key: 'a', d: 'M3.7 2.4h5.4l2.9 2.9v8.3H3.7z' }),
          h('path', { key: 'b', d: 'M8.9 2.5v2.9h2.9' }),
        ]),
      branch: (p) =>
        svg(p, [
          h('circle', { key: 'a', cx: 4.6, cy: 3.9, r: 1.35 }),
          h('circle', { key: 'b', cx: 4.6, cy: 12.1, r: 1.35 }),
          h('circle', { key: 'c', cx: 11.4, cy: 5.5, r: 1.35 }),
          h('path', { key: 'd', d: 'M4.6 5.25v5.5' }),
          h('path', { key: 'e', d: 'M11.4 6.85c0 2.05-1.7 3.05-3.6 3.35' }),
        ]),
      globe: (p) =>
        svg(p, [
          h('circle', { key: 'a', cx: 8, cy: 8, r: 5.9 }),
          h('path', { key: 'b', d: 'M2.3 8h11.4' }),
          h('path', { key: 'c', d: 'M8 2.1c1.65 1.85 2.5 3.85 2.5 5.9S9.65 12.05 8 13.9C6.35 12.05 5.5 10.05 5.5 8s.85-4.05 2.5-5.9z' }),
        ]),
      refresh: (p) =>
        svg(p, [
          h('path', { key: 'a', d: 'M13.1 8a5.1 5.1 0 1 1-1.63-3.77' }),
          h('path', { key: 'b', d: 'M13.3 2.5v2.95h-2.95' }),
        ]),
      close: (p) => svg(p, [h('path', { key: 'a', d: 'M4.4 4.4l7.2 7.2M11.6 4.4l-7.2 7.2' })]),
      plus: (p) => svg(p, [h('path', { key: 'a', d: 'M8 3.6v8.8M3.6 8h8.8' })]),
      check: (p) => svg(p, [h('path', { key: 'a', d: 'M3.3 8.5l3.1 3.1 6.3-6.9' })]),
      minus: (p) => svg(p, [h('path', { key: 'a', d: 'M3.6 8h8.8' })]),
      undo: (p) =>
        svg(p, [
          h('path', { key: 'a', d: 'M3 7.2h6.1a3.5 3.5 0 0 1 0 7H6.4' }),
          h('path', { key: 'b', d: 'M5.3 4.2L2.4 7.2l2.9 3' }),
        ]),
      up: (p) => svg(p, [h('path', { key: 'a', d: 'M8 12.6V3.6M4.4 7.2L8 3.5l3.6 3.7' })]),
      down: (p) => svg(p, [h('path', { key: 'a', d: 'M8 3.4v9M4.4 8.8L8 12.5l3.6-3.7' })]),
      cloud: (p) =>
        svg(p, [
          h('path', { key: 'a', d: 'M4.6 11.6a2.9 2.9 0 0 1-.2-5.8 3.7 3.7 0 0 1 7.05 1.1 2.4 2.4 0 0 1-.35 4.7z' }),
          h('path', { key: 'b', d: 'M8 12.9v-4.2M6.3 10.3L8 8.6l1.7 1.7' }),
        ]),
      repo: (p) =>
        svg(p, [
          h('path', { key: 'a', d: 'M3.4 3.2h6.2l3 3v6.6H3.4z' }),
          h('path', { key: 'b', d: 'M9.4 3.3v3h3' }),
          h('path', { key: 'c', d: 'M5.6 9.6h2.2M5.6 11.6h4.8' }),
        ]),
      clock: (p) =>
        svg(p, [
          h('circle', { key: 'a', cx: 8, cy: 8, r: 5.8 }),
          h('path', { key: 'b', d: 'M8 4.6V8l2.4 1.5' }),
        ]),
      fork: (p) =>
        svg(p, [
          h('circle', { key: 'a', cx: 4.2, cy: 4, r: 1.25 }),
          h('circle', { key: 'b', cx: 11.8, cy: 4, r: 1.25 }),
          h('circle', { key: 'c', cx: 8, cy: 12, r: 1.25 }),
          h('path', { key: 'd', d: 'M4.2 5.3c0 2.6 1.6 3.6 3.8 4.2M11.8 5.3c0 2.6-1.6 3.6-3.8 4.2' }),
        ]),
      warn: (p) =>
        svg(p, [
          h('path', { key: 'a', d: 'M8 2.6l5.6 10.2H2.4z' }),
          h('path', { key: 'b', d: 'M8 6.4v3.1M8 11.3v.1' }),
        ]),
    }

    const spin = { animation: 'dshsb-spin 900ms linear infinite' }

    // ── stylesheet ──────────────────────────────────────────────────────────
    const CSS = `
.dshsb-root{
  --dshsb-hair:color-mix(in srgb,var(--dsw-alias-border-l1) 78%,transparent);
  --dshsb-hair-soft:color-mix(in srgb,var(--dsw-alias-border-l1) 46%,transparent);
  --dshsb-sheen:color-mix(in srgb,var(--dsw-alias-label-primary) 5%,transparent);
  --dshsb-ease:cubic-bezier(.22,.61,.36,1);
  --dshsb-mono:var(--ds-font-family-code);
  position:relative;display:flex;flex-direction:column;flex:1 1 auto;height:100%;min-height:0;
  color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base);
  font:var(--dsw-font-xxs-12);-webkit-font-smoothing:antialiased;overflow:hidden;
}
.dshsb-root *{box-sizing:border-box}
.dshsb-root button{font:inherit;color:inherit;background:none;border:none;padding:0;cursor:pointer}
.dshsb-root input,.dshsb-root textarea{font:inherit;color:inherit}
.dshsb-root ::-webkit-scrollbar{width:7px;height:7px}
.dshsb-root ::-webkit-scrollbar-thumb{background:var(--dsw-alias-border-l2);border-radius:8px;border:2px solid transparent;background-clip:content-box}
.dshsb-root ::-webkit-scrollbar-thumb:hover{background:color-mix(in srgb,var(--dsw-alias-label-secondary) 55%,transparent);background-clip:content-box}
.dshsb-root ::-webkit-scrollbar-track{background:transparent}

/* top bar --------------------------------------------------------------- */
.dshsb-top{display:flex;align-items:center;gap:8px;height:36px;padding:0 12px;flex:none;
  border-bottom:1px solid var(--dshsb-hair)}
.dshsb-top-name{flex:none;white-space:nowrap;font:var(--dsw-font-xxxs-strong-11);letter-spacing:.07em;
  color:var(--dsw-alias-label-secondary);flex:none}
.dshsb-repo{flex:1 1 auto;min-width:0;font:var(--dsw-font-xxxs-11);letter-spacing:.01em;
  color:var(--dsw-alias-label-secondary);opacity:.72;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;direction:rtl;text-align:left}
.dshsb-icon{display:grid;place-items:center;width:22px;height:22px;border-radius:6px;flex:none;
  color:var(--dsw-alias-label-secondary);
  transition:background 140ms var(--dshsb-ease),color 140ms var(--dshsb-ease),transform 120ms var(--dshsb-ease)}
.dshsb-icon:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.dshsb-icon:active{transform:scale(.9)}
.dshsb-icon:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.dshsb-icon[data-on]{color:var(--dsw-alias-brand-primary);
  background:color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,transparent)}
.dshsb-icon:disabled{opacity:.4;pointer-events:none}
.dshsb-icon[data-busy] svg{animation:dshsb-spin 900ms linear infinite}

/* pane chrome ----------------------------------------------------------- */
.dshsb-pane{display:flex;flex-direction:column;min-height:0;flex:none;position:relative}
.dshsb-pane--grow{flex:1 1 auto;min-height:132px}
.dshsb-head{display:flex;align-items:center;gap:7px;height:32px;padding:0 12px;flex:none;
  border-bottom:1px solid var(--dshsb-hair-soft)}
.dshsb-head-ico{display:grid;place-items:center;color:var(--dsw-alias-label-secondary)}
.dshsb-head-title{flex:none;white-space:nowrap;font:var(--dsw-font-xxs-strong-12);letter-spacing:.03em;
  color:var(--dsw-alias-label-primary)}
.dshsb-head-meta{margin-left:auto;display:flex;align-items:center;gap:5px;min-width:0;overflow:hidden}
.dshsb-count{font:var(--dsw-font-xxxs-11);font-variant-numeric:tabular-nums;letter-spacing:.02em;
  color:var(--dsw-alias-label-secondary);padding:0 5px;height:16px;display:inline-flex;
  align-items:center;border-radius:999px;background:var(--dsw-alias-bg-layer-2)}

/* splitter -------------------------------------------------------------- */
.dshsb-split{flex:none;height:9px;position:relative;cursor:row-resize;touch-action:none;z-index:4}
.dshsb-split::before{content:"";position:absolute;left:0;right:0;top:4px;height:1px;
  background:var(--dshsb-hair);transition:background 160ms var(--dshsb-ease),transform 160ms var(--dshsb-ease)}
.dshsb-split::after{content:"";position:absolute;left:50%;top:2px;width:24px;height:5px;margin-left:-12px;
  border-radius:3px;background:var(--dsw-alias-brand-primary);opacity:0;
  transition:opacity 160ms var(--dshsb-ease)}
.dshsb-split:hover::before,.dshsb-split[data-drag]::before{transform:scaleY(2);
  background:color-mix(in srgb,var(--dsw-alias-brand-primary) 62%,transparent)}
.dshsb-split:hover::after,.dshsb-split[data-drag]::after{opacity:.8}
.dshsb-split:focus-visible{outline:none}
.dshsb-split:focus-visible::before{background:var(--dsw-alias-brand-primary);transform:scaleY(2)}

/* notes ----------------------------------------------------------------- */
.dshsb-note-wrap{flex:1 1 auto;min-height:0;padding:10px 12px 12px}
.dshsb-note{height:100%;display:flex;flex-direction:column;border-radius:14px;overflow:hidden;
  background:linear-gradient(180deg,
    color-mix(in srgb,var(--dsw-alias-bg-layer-1) 70%,var(--dsw-alias-bg-base)) 0%,
    var(--dsw-alias-bg-layer-1) 40%);
  border:1px solid var(--dshsb-hair);
  box-shadow:inset 0 1px 0 var(--dshsb-sheen);
  transition:border-color 180ms var(--dshsb-ease),box-shadow 180ms var(--dshsb-ease)}
.dshsb-note:hover{border-color:color-mix(in srgb,var(--dsw-alias-border-l2) 76%,transparent)}
.dshsb-note:focus-within{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 40%,transparent);
  box-shadow:inset 0 1px 0 var(--dshsb-sheen),
    0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary) 9%,transparent)}
.dshsb-note textarea{flex:1 1 auto;min-height:0;width:100%;resize:none;border:none;outline:none;
  background:transparent;padding:12px 14px;font:var(--dsw-font-xs-13);
  caret-color:var(--dsw-alias-brand-primary)}
.dshsb-note textarea::placeholder{color:var(--dsw-alias-label-secondary);opacity:.58}
.dshsb-save{display:inline-flex;align-items:center;gap:5px;font:var(--dsw-font-xxxs-11);letter-spacing:.02em;
  transition:color 200ms var(--dshsb-ease)}
.dshsb-dot{width:5px;height:5px;border-radius:50%;background:currentColor;flex:none;
  box-shadow:0 0 0 3px color-mix(in srgb,currentColor 14%,transparent)}
.dshsb-save[data-state=saved]{color:var(--dsw-alias-state-success-primary)}
.dshsb-save[data-state=dirty]{color:var(--dsw-alias-state-warn-primary)}
.dshsb-save[data-state=error]{color:var(--dsw-alias-state-error-primary)}
.dshsb-save[data-state=saving]{color:var(--dsw-alias-label-secondary)}
.dshsb-save[data-state=saving] .dshsb-dot{animation:dshsb-pulse 1.1s ease-in-out infinite}
.dshsb-meta-text{font:var(--dsw-font-xxxs-11);color:var(--dsw-alias-label-secondary);
  font-variant-numeric:tabular-nums;opacity:.78}

/* buttons --------------------------------------------------------------- */
.dshsb-btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;height:23px;
  padding:0 9px;border-radius:7px;font:var(--dsw-font-xxs-12);white-space:nowrap;
  color:var(--dsw-alias-label-secondary);border:1px solid transparent;
  transition:background 140ms var(--dshsb-ease),color 140ms var(--dshsb-ease),
    border-color 140ms var(--dshsb-ease),transform 110ms var(--dshsb-ease),filter 140ms}
.dshsb-btn:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.dshsb-btn:active{transform:scale(.965)}
.dshsb-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.dshsb-btn:disabled{opacity:.38;pointer-events:none}
.dshsb-btn[data-variant=primary]{background:var(--dsw-alias-brand-primary);
  color:var(--dsw-alias-bg-base);font:var(--dsw-font-xxs-strong-12)}
.dshsb-btn[data-variant=primary]:hover{filter:brightness(1.07);color:var(--dsw-alias-bg-base);
  background:var(--dsw-alias-brand-primary)}
.dshsb-btn[data-variant=quiet]{border-color:var(--dshsb-hair)}
.dshsb-btn[data-variant=danger]:hover{color:var(--dsw-alias-state-error-primary);
  background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 12%,transparent)}

/* chips ----------------------------------------------------------------- */
.dshsb-chip{display:inline-flex;align-items:center;gap:4px;height:19px;padding:0 7px;
  border-radius:999px;font:var(--dsw-font-xxxs-11);letter-spacing:.01em;white-space:nowrap;
  color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);
  border:1px solid var(--dshsb-hair-soft);font-variant-numeric:tabular-nums;
  max-width:120px;overflow:hidden;text-overflow:ellipsis;
  transition:background 140ms var(--dshsb-ease),color 140ms var(--dsw-alias-label-primary)}
.dshsb-chip[data-tone=ok]{color:var(--dsw-alias-state-success-primary);
  border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary) 26%,transparent);
  background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 9%,transparent)}
.dshsb-chip[data-tone=warn]{color:var(--dsw-alias-state-warn-primary);
  border-color:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 26%,transparent);
  background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 9%,transparent)}
.dshsb-chip[data-tone=err]{color:var(--dsw-alias-state-error-primary);
  border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 26%,transparent);
  background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 9%,transparent)}
.dshsb-branchbtn{display:inline-flex;align-items:center;gap:5px;height:21px;padding:0 8px;
  border-radius:999px;font:var(--dsw-font-xxs-12);max-width:150px;color:var(--dsw-alias-label-primary);
  background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dshsb-hair);
  transition:border-color 140ms var(--dshsb-ease),background 140ms var(--dshsb-ease)}
.dshsb-branchbtn:hover{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 40%,transparent)}
.dshsb-branchbtn span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* git body -------------------------------------------------------------- */
.dshsb-git-body{flex:1 1 auto;min-height:0;overflow:auto;padding:2px 6px 8px}
.dshsb-group-name{flex:none;white-space:nowrap}
.dshsb-group{display:flex;align-items:center;gap:6px;padding:7px 6px 4px;position:sticky;top:0;z-index:1;
  background:var(--dsw-alias-bg-base);font:var(--dsw-font-xxxs-strong-11);letter-spacing:.08em;
  color:var(--dsw-alias-label-secondary);text-transform:uppercase}
.dshsb-group .dshsb-gline{flex:1 1 auto;height:1px;background:var(--dshsb-hair-soft)}
.dshsb-row{display:flex;align-items:center;gap:7px;height:25px;padding:0 6px;border-radius:7px;
  transition:background 120ms var(--dshsb-ease)}
.dshsb-row:hover{background:var(--dsw-alias-bg-layer-2)}
.dshsb-row[data-active]{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 10%,transparent)}
.dshsb-state{width:13px;flex:none;text-align:center;font-family:var(--dshsb-mono);font-weight:600;font-size:var(--dsw-font-xxxs-11-font-size);line-height:1}
.dshsb-state[data-kind=modified]{color:var(--dsw-alias-state-warn-primary)}
.dshsb-state[data-kind=untracked]{color:var(--dsw-alias-label-secondary)}
.dshsb-state[data-kind=added]{color:var(--dsw-alias-state-success-primary)}
.dshsb-state[data-kind=deleted]{color:var(--dsw-alias-state-error-primary)}
.dshsb-state[data-kind=conflict]{color:var(--dsw-alias-state-error-primary)}
.dshsb-state[data-kind=renamed],.dshsb-state[data-kind=copied]{color:var(--dsw-alias-brand-primary)}
.dshsb-rowico{display:grid;place-items:center;width:14px;flex:none;color:var(--dsw-alias-label-secondary)}
.dshsb-file{flex:1 1 auto;min-width:0;text-align:left;font-family:var(--dshsb-mono);font-size:var(--dsw-font-xxxs-11-font-size);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  transition:color 120ms var(--dshsb-ease)}
.dshsb-file em{font-style:normal;color:var(--dsw-alias-label-secondary)}
.dshsb-rowacts{display:flex;align-items:center;gap:1px;flex:none;opacity:0;
  transition:opacity 130ms var(--dshsb-ease)}
.dshsb-row:hover .dshsb-rowacts,.dshsb-row:focus-within .dshsb-rowacts{opacity:1}
.dshsb-tiny{display:grid;place-items:center;width:19px;height:19px;border-radius:5px;
  color:var(--dsw-alias-label-secondary);
  transition:background 120ms var(--dshsb-ease),color 120ms var(--dshsb-ease),transform 110ms}
.dshsb-tiny:hover{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}
.dshsb-tiny:active{transform:scale(.9)}
.dshsb-tiny[data-danger]:hover{color:var(--dsw-alias-state-error-primary)}
.dshsb-clean{display:flex;flex-direction:column;align-items:center;gap:8px;padding:22px 16px;
  color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xxs-12);text-align:center}
.dshsb-clean--err{padding:14px 12px;font-family:var(--dshsb-mono);
  font-size:var(--dsw-font-xxxs-11-font-size);line-height:1.6;word-break:break-word}
.dshsb-clean-ico{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;
  color:var(--dsw-alias-state-success-primary);
  background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 12%,transparent);
  box-shadow:0 0 0 1px color-mix(in srgb,var(--dsw-alias-state-success-primary) 24%,transparent) inset}

/* diff ------------------------------------------------------------------ */
.dshsb-diff{margin:6px 0 8px;border-radius:10px;overflow:auto;max-height:170px;
  border:1px solid var(--dshsb-hair);background:var(--dsw-alias-bg-layer-1);
  animation:dshsb-fade 170ms var(--dshsb-ease) both}
.dshsb-diff pre{margin:0;padding:8px 10px;font:var(--dsw-font-markdown-code-block);
  white-space:pre-wrap;word-break:break-word}
.dshsb-dl[data-t=add]{color:var(--dsw-alias-state-success-primary)}
.dshsb-dl[data-t=del]{color:var(--dsw-alias-state-error-primary)}
.dshsb-dl[data-t=hunk]{color:var(--dsw-alias-brand-primary)}
.dshsb-dl[data-t=meta]{color:var(--dsw-alias-label-secondary);opacity:.85}

/* control skin ---------------------------------------------------------- */
/* Declared before the per-use rules: same specificity, so a later rule wins. */
.dshsb-field{flex:1 1 auto;min-width:0;height:23px;padding:0 7px;border-radius:6px;font:var(--dsw-font-xxs-12);
  border:1px solid var(--dshsb-hair);background:var(--dsw-alias-bg-layer-2);outline:none;
  transition:border-color 140ms var(--dshsb-ease)}
.dshsb-field:focus{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 50%,transparent)}

/* commit message row ---------------------------------------------------- */
.dshsb-commit-msg{display:flex;align-items:center;gap:8px;padding:8px 10px;flex:none}
.dshsb-commit-input{height:32px}
.dshsb-commit-input::placeholder{color:var(--dsw-alias-label-secondary);opacity:.62}
.dshsb-commit-btn{flex:0 0 22%;max-width:96px;height:32px;padding:0}
.dshsb-actions{display:flex;align-items:center;gap:3px;padding:7px 8px 8px;flex:none;flex-wrap:wrap}

/* init card ------------------------------------------------------------- */
.dshsb-init{flex:1 1 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:9px;padding:20px 18px;text-align:center}
.dshsb-init-ico{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;
  color:var(--dsw-alias-brand-primary);
  background:color-mix(in srgb,var(--dsw-alias-brand-primary) 11%,transparent);
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--dsw-alias-brand-primary) 22%,transparent)}
.dshsb-init-title{font:var(--dsw-font-xxs-strong-12);color:var(--dsw-alias-label-primary)}
.dshsb-init-hint{font:var(--dsw-font-xxxs-11);color:var(--dsw-alias-label-secondary);
  max-width:230px}
.dshsb-init .dshsb-btn{margin-top:3px;height:26px;padding:0 13px}
.dshsb-err{color:var(--dsw-alias-state-error-primary);font:var(--dsw-font-xxxs-11);padding:10px 12px;
  word-break:break-word}

/* crash guard ----------------------------------------------------------- */
.dshsb-crash{display:flex;flex-direction:column;gap:6px;padding:16px 14px;
  font:var(--dsw-font-xxxs-11);color:var(--dsw-alias-state-error-primary)}
.dshsb-crash-title{font:var(--dsw-font-xxs-strong-12);color:var(--dsw-alias-label-primary)}
.dshsb-crash-text{color:var(--dsw-alias-label-secondary);white-space:pre-wrap;word-break:break-word;
  max-height:220px;overflow:auto}

/* branch menu ----------------------------------------------------------- */
.dshsb-menu-backdrop{position:fixed;inset:0;z-index:19}
.dshsb-menu{position:absolute;left:8px;right:8px;top:31px;z-index:20;padding:5px;
  border-radius:11px;background:var(--dsw-alias-bg-overlay);
  border:1px solid var(--dsw-alias-border-l2);
  box-shadow:0 14px 34px -14px color-mix(in srgb,#000 58%,transparent);
  animation:dshsb-pop 150ms var(--dshsb-ease) both}
.dshsb-menu-label{font:var(--dsw-font-xxxs-11);letter-spacing:.08em;
  color:var(--dsw-alias-label-secondary);padding:4px 7px 3px}
.dshsb-menu-list{max-height:170px;overflow:auto}
.dshsb-menu-row{display:flex;align-items:center;gap:6px;width:100%;height:24px;padding:0 7px;
  border-radius:6px;font:var(--dsw-font-xxs-12);text-align:left;color:var(--dsw-alias-label-primary);
  transition:background 120ms var(--dshsb-ease)}
.dshsb-menu-row:hover{background:var(--dsw-alias-bg-layer-2)}
.dshsb-menu-row[data-current]{color:var(--dsw-alias-brand-primary)}
.dshsb-menu-row span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dshsb-menu-new{display:flex;gap:4px;padding:4px 5px 2px;border-top:1px solid var(--dshsb-hair-soft);
  margin-top:4px}

/* commit graph ---------------------------------------------------------- */
.dshsb-hist-body{flex:1 1 auto;min-height:0;overflow:auto;padding:3px 6px 8px}
.dshsb-commit-row{display:flex;align-items:flex-start;gap:7px;padding:4px 6px;border-radius:8px;
  transition:background 120ms var(--dshsb-ease)}
.dshsb-commit-row:hover{background:var(--dsw-alias-bg-layer-2)}
.dshsb-commit-row{cursor:pointer}
.dshsb-commit-stats{display:flex;align-items:center;gap:7px;margin-top:2px;
  font:var(--dsw-font-xxxs-11)}
.dshsb-stat-add{color:var(--dsw-alias-state-success-primary)}
.dshsb-stat-del{color:var(--dsw-alias-state-error-primary)}
.dshsb-stat-files{color:var(--dsw-alias-label-secondary)}
.dshsb-commit-detail{display:flex;flex-direction:column;gap:3px;margin:2px 6px 5px 25px;
  padding:5px 8px;border-left:1px solid var(--dshsb-hair);
  border-radius:0 7px 7px 0;background:var(--dsw-alias-bg-layer-1);
  animation:dshsb-fade 150ms var(--dshsb-ease) both}
.dshsb-commit-file{display:flex;align-items:center;gap:6px;min-width:0;
  font:var(--dsw-font-xxxs-11)}
.dshsb-commit-file-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;
  white-space:nowrap;font-family:var(--dshsb-mono)}
.dshsb-commit-file-stat{display:flex;align-items:center;gap:5px;flex:none;font-variant-numeric:tabular-nums}
.dshsb-graph{position:relative;width:11px;flex:none;align-self:stretch}
.dshsb-graph::before{content:"";position:absolute;left:5px;top:0;bottom:0;width:1px;
  background:var(--dshsb-hair)}
.dshsb-commit-row:first-child .dshsb-graph::before{top:10px}
.dshsb-commit-row:last-child .dshsb-graph::before{bottom:auto;height:10px}
.dshsb-graph i{position:absolute;left:2.5px;top:7px;width:6px;height:6px;border-radius:50%;
  background:var(--dsw-alias-bg-base);box-sizing:border-box;
  border:1.5px solid color-mix(in srgb,var(--dsw-alias-label-secondary) 65%,transparent);
  transition:border-color 140ms var(--dsw-alias-brand-primary)}
.dshsb-commit-row[data-head] .dshsb-graph i{background:var(--dsw-alias-brand-primary);
  border-color:var(--dsw-alias-brand-primary);
  box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary) 16%,transparent)}
.dshsb-commit-text{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:1px}
.dshsb-commit-subject{font:var(--dsw-font-xxs-12);overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap}
.dshsb-commit-row[data-head] .dshsb-commit-subject{font-weight:600}
.dshsb-commit-meta{display:flex;align-items:center;gap:6px;font:var(--dsw-font-xxxs-11);
  color:var(--dsw-alias-label-secondary);letter-spacing:.01em}
.dshsb-hash{font-family:var(--dshsb-mono);font-size:var(--dsw-font-xxxs-11-font-size);
  color:color-mix(in srgb,var(--dsw-alias-brand-primary) 82%,var(--dsw-alias-label-secondary))}
.dshsb-merge{display:grid;place-items:center;color:var(--dsw-alias-label-secondary)}

/* browser --------------------------------------------------------------- */
.dshsb-browser{display:flex;flex-direction:column;flex:none;min-height:0;
  border-top:1px solid var(--dshsb-hair);background:var(--dsw-alias-bg-base)}
.dshsb-tabs{display:flex;align-items:center;gap:3px;padding:5px 8px 0;flex:none;
  overflow-x:auto;scrollbar-width:none}
.dshsb-tabs::-webkit-scrollbar{display:none}
.dshsb-tab{display:inline-flex;align-items:center;gap:4px;height:22px;max-width:150px;
  padding:0 4px 0 8px;border-radius:7px;flex:none;font:var(--dsw-font-xxs-12);
  color:var(--dsw-alias-label-secondary);
  transition:background 140ms var(--dshsb-ease),color 140ms var(--dshsb-ease),
    box-shadow 140ms var(--dshsb-ease)}
.dshsb-tab:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.dshsb-tab[data-active]{background:var(--dsw-alias-bg-layer-1);
  color:var(--dsw-alias-label-primary);box-shadow:inset 0 0 0 1px var(--dshsb-hair)}
.dshsb-tab-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:96px;
  background:none;border:none;padding:0;color:inherit;font:inherit}
.dshsb-tab-x{display:grid;place-items:center;width:14px;height:14px;border-radius:4px;
  opacity:.5;transition:opacity 130ms,background 130ms}
.dshsb-tab-x:hover{opacity:1;background:var(--dsw-alias-bg-layer-2)}
.dshsb-addr{display:flex;align-items:center;gap:5px;padding:6px 8px;flex:none}
.dshsb-addr input{flex:1 1 auto;min-width:0;height:25px;padding:0 9px;border-radius:8px;
  font:var(--dsw-font-xxs-12);border:1px solid var(--dshsb-hair);background:var(--dsw-alias-bg-layer-2);
  outline:none;transition:border-color 150ms var(--dshsb-ease),box-shadow 150ms var(--dshsb-ease)}
.dshsb-addr input:focus{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 52%,transparent);
  box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary) 10%,transparent)}
.dshsb-frame{flex:1 1 auto;min-height:0;position:relative;border-top:1px solid var(--dshsb-hair-soft)}
.dshsb-frame iframe{width:100%;height:100%;border:none;display:block;
  background:var(--dsw-alias-bg-layer-1);animation:dshsb-fade 200ms var(--dshsb-ease) both}
.dshsb-frameless{position:absolute;inset:0;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:7px;padding:16px;text-align:center;
  color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xxxs-11)}

.dshsb-browser--fill{flex:1 1 auto;min-height:0;height:auto;border-top:none}
.dshsb-browser--fill .dshsb-tabs{padding-top:6px}

/* toast ----------------------------------------------------------------- */
.dshsb-toast{position:absolute;left:10px;right:10px;bottom:9px;z-index:30;
  display:flex;align-items:center;gap:7px;padding:7px 10px;border-radius:9px;font:var(--dsw-font-xxs-12);
  background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l2);
  box-shadow:0 12px 30px -14px color-mix(in srgb,#000 55%,transparent);
  animation:dshsb-toastin 200ms var(--dshsb-ease) both;pointer-events:none}
.dshsb-toast[data-tone=ok]{border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary) 34%,transparent)}
.dshsb-toast[data-tone=err]{border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 38%,transparent)}

@keyframes dshsb-spin{to{transform:rotate(360deg)}}
@keyframes dshsb-fade{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}
@keyframes dshsb-pop{from{opacity:0;transform:scale(.96) translateY(-2px)}to{opacity:1;transform:none}}
@keyframes dshsb-toastin{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
@keyframes dshsb-pulse{0%,100%{opacity:1}50%{opacity:.28}}
@media (prefers-reduced-motion:reduce){
  .dshsb-root *,.dshsb-root *::before,.dshsb-root *::after{
    animation-duration:1ms !important;animation-iteration-count:1 !important;
    transition-duration:1ms !important}
}
`

    // ── helpers ─────────────────────────────────────────────────────────────
    const clamp = (value, min, max) => Math.round(Math.min(max, Math.max(min, value)))

    /** Git state is only meaningful once the Session's history is open or settled. */
    function sessionReady(openState) {
      return openState === 'open' || openState === 'error'
    }

    /**
     * One stable verdict string per Git status, so a poll can skip a full reload.
     * Covers everything the pane paints: the repository verdict, the branch, the
     * tracking counts, and each path with its index/worktree codes.
     */
    function gitFingerprint(status) {
      if (!status) return ''
      if (status.ok === false) return `no:${status.reason ?? 'failed'}`
      const files = Array.isArray(status.files) ? status.files : []
      const rows = files.map((file) => `${file.staged ? 'i' : 'w'}:${file.code}:${file.path}`)
      return [
        status.branch ?? '',
        status.detached === true ? 'detached' : '',
        status.ahead ?? 0,
        status.behind ?? 0,
        rows.join(','),
      ].join('|')
    }

    const DEFAULT_SIZES = { notes: 208, history: 176 }

    function readSizes() {
      try {
        const raw = window.localStorage.getItem(SIZES_KEY)
        const parsed = raw ? JSON.parse(raw) : null
        if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_SIZES }
        return { ...DEFAULT_SIZES, ...parsed }
      } catch {
        return { ...DEFAULT_SIZES }
      }
    }

    const COMMIT_DRAFT_PREFIX = 'dsh-sidebar:commit-draft:v1:'

    function commitDraftKey(sessionId) {
      return `${COMMIT_DRAFT_PREFIX}${encodeURIComponent(sessionId)}`
    }

    function readCommitDraft(sessionId) {
      try {
        return window.localStorage.getItem(commitDraftKey(sessionId)) ?? ''
      } catch {
        return ''
      }
    }

    function writeCommitDraft(sessionId, value) {
      try {
        const key = commitDraftKey(sessionId)
        if (value.length === 0) window.localStorage.removeItem(key)
        else window.localStorage.setItem(key, value)
      } catch {
        // localStorage is optional; the in-memory editor remains usable.
      }
    }

    function clearCommitDraft(sessionId) {
      try {
        window.localStorage.removeItem(commitDraftKey(sessionId))
      } catch {
        // localStorage is optional.
      }
    }

    const RIGHTBAR_LAYOUT_KEY = 'dsh-sidebar:rightbar-layout:v1'
    /** Width writes arrive once per animation frame while dragging. */
    const RIGHTBAR_PERSIST_DELAY = 250

    /** @returns the remembered column layout, or null on first run. */
    function readRightbarLayout() {
      try {
        const raw = window.localStorage.getItem(RIGHTBAR_LAYOUT_KEY)
        const parsed = raw ? JSON.parse(raw) : null
        if (!parsed || typeof parsed !== 'object') return null
        const width = Number(parsed.width)
        return {
          width: Number.isFinite(width) && width > 0 ? width : null,
          shown: parsed.shown === true ? true : parsed.shown === false ? false : null,
        }
      } catch {
        return null
      }
    }

    function writeRightbarLayout(value) {
      try {
        window.localStorage.setItem(RIGHTBAR_LAYOUT_KEY, JSON.stringify(value))
      } catch {
        // localStorage is optional; the column still resizes for this run.
      }
    }

    /** A column the user closed stays closed; an unknown state keeps the default. */
    function shouldAutoOpenRightbar() {
      return readRightbarLayout()?.shown !== false
    }

    /**
     * Remember the shipped right column's width and open state.
     *
     * The layout store of `@deepseek-ai/dsh-client-ui-layout` is not persisted,
     * so its first `openRightbar` falls back to 45% of the viewport. This bridges
     * the controller's own action object — the same one the frame's resize handle
     * writes — to replay the last width before that first open and to learn every
     * later change. Teardown restores the original methods.
     * @param layout - the Client `layout` service, if mounted.
     * @returns idempotent disposer.
     */
    function bridgeRightbarLayout(layout) {
      const panels = layout?.panels
      if (!panels || typeof panels.setRightbar !== 'function') return () => {}

      const original = {
        setRightbar: panels.setRightbar,
        openRightbar: panels.openRightbar,
        closeRightbar: panels.closeRightbar,
      }
      const saved = readRightbarLayout()
      let width = saved?.width ?? null
      let shown = saved?.shown ?? null
      let timer = 0

      // Seed the preference first: `rightbar ??= 45%` only assigns when unset.
      if (width !== null) original.setRightbar(width)

      const persist = () => writeRightbarLayout({ width, shown })
      const schedule = () => {
        window.clearTimeout(timer)
        timer = window.setTimeout(persist, RIGHTBAR_PERSIST_DELAY)
      }

      const wrapped = {
        setRightbar: (px) => {
          original.setRightbar(px)
          width = px
          schedule()
        },
        openRightbar: (track, fullscreen) => {
          original.openRightbar(track, fullscreen)
          shown = true
          schedule()
        },
        closeRightbar: () => {
          original.closeRightbar()
          shown = false
          schedule()
        },
      }

      panels.setRightbar = wrapped.setRightbar
      panels.openRightbar = wrapped.openRightbar
      panels.closeRightbar = wrapped.closeRightbar

      return () => {
        window.clearTimeout(timer)
        // Only unwind what this bridge still owns.
        if (panels.setRightbar === wrapped.setRightbar) panels.setRightbar = original.setRightbar
        if (panels.openRightbar === wrapped.openRightbar) panels.openRightbar = original.openRightbar
        if (panels.closeRightbar === wrapped.closeRightbar) panels.closeRightbar = original.closeRightbar
      }
    }

    function useToast() {
      const [toast, setToast] = React.useState(null)
      const timer = React.useRef(0)
      const show = React.useCallback((text, tone) => {
        setToast({ text, tone: tone ?? 'ok' })
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => setToast(null), 2600)
      }, [])
      React.useEffect(() => () => window.clearTimeout(timer.current), [])
      return [toast, show]
    }

    function Toast(props) {
      if (!props.toast) return null
      return h(
        'div',
        { className: 'dshsb-toast', 'data-tone': props.toast.tone, role: 'status' },
        h(
          'span',
          { style: { display: 'grid', placeItems: 'center' } },
          props.toast.tone === 'err' ? h(Glyph.warn, { size: 12 }) : h(Glyph.check, { size: 12 }),
        ),
        h('span', { style: { flex: '1 1 auto', minWidth: 0 } }, props.toast.text),
      )
    }

    function IconButton(props) {
      return h(
        'button',
        {
          type: 'button',
          className: 'dshsb-icon',
          title: props.title,
          'aria-label': props.title,
          'aria-pressed': props.on === undefined ? undefined : props.on ? 'true' : 'false',
          'data-on': props.on ? '' : undefined,
          'data-busy': props.busy ? '' : undefined,
          disabled: props.disabled ? true : undefined,
          onClick: props.onClick,
        },
        h(props.glyph, { size: props.size ?? 13, style: props.busy ? spin : undefined }),
      )
    }

    function Btn(props) {
      return h(
        'button',
        {
          type: 'button',
          className: 'dshsb-btn',
          'data-variant': props.variant,
          title: props.title ?? (typeof props.children === 'string' ? props.children : undefined),
          disabled: props.disabled ? true : undefined,
          onClick: props.onClick,
        },
        props.glyph ? h(props.glyph, { size: 11, style: props.busy ? spin : undefined }) : null,
        props.children,
      )
    }

    function Splitter(props) {
      const active = React.useRef(false)
      const last = React.useRef(0)
      const [dragging, setDragging] = React.useState(false)

      const down = (event) => {
        if (event.button !== 0) return
        active.current = true
        last.current = event.clientY
        setDragging(true)
        try {
          event.currentTarget.setPointerCapture(event.pointerId)
        } catch {
          // pointer capture is a nicety; dragging still works without it
        }
      }

      const move = (event) => {
        if (!active.current) return
        const dy = event.clientY - last.current
        if (dy === 0) return
        last.current = event.clientY
        props.onDelta(dy)
      }

      const up = (event) => {
        if (!active.current) return
        active.current = false
        setDragging(false)
        try {
          event.currentTarget.releasePointerCapture(event.pointerId)
        } catch {
          // the pointer may already be gone
        }
      }

      return h('div', {
        className: 'dshsb-split',
        role: 'separator',
        'aria-orientation': 'horizontal',
        'aria-label': props.label,
        tabIndex: 0,
        'data-drag': dragging ? '' : undefined,
        onPointerDown: down,
        onPointerMove: move,
        onPointerUp: up,
        onPointerCancel: up,
        onKeyDown: (event) => {
          if (event.key === 'ArrowUp') {
            event.preventDefault()
            props.onDelta(-16)
          } else if (event.key === 'ArrowDown') {
            event.preventDefault()
            props.onDelta(16)
          }
        },
      })
    }

    // ── notes ───────────────────────────────────────────────────────────────
    function NotesPane(props) {
      const { sessionId, t, height } = props
      const [text, setText] = React.useState('')
      const [state, setState] = React.useState('idle')
      const saved = React.useRef(null)
      const latest = React.useRef('')
      const timer = React.useRef(0)

      const flush = React.useCallback(
        async (value) => {
          if (saved.current === value) return
          saved.current = value
          setState('saving')
          try {
            await api.saveNotes(sessionId, value)
            setState('saved')
          } catch {
            saved.current = null
            setState('error')
          }
        },
        [sessionId],
      )

      React.useEffect(() => {
        let live = true
        saved.current = null
        api.notes(sessionId).then(
          (body) => {
            if (!live) return
            const value = typeof body?.text === 'string' ? body.text : ''
            saved.current = value
            latest.current = value
            setText(value)
            setState(value ? 'saved' : 'idle')
          },
          () => {
            if (live) setState('error')
          },
        )
        return () => {
          live = false
        }
      }, [sessionId])

      // A debounce still in flight when the tab closes must not lose the last keystroke.
      React.useEffect(
        () => () => {
          window.clearTimeout(timer.current)
          if (saved.current !== latest.current) void api.saveNotes(sessionId, latest.current).catch(() => {})
        },
        [sessionId],
      )

      const onChange = (value) => {
        latest.current = value
        setText(value)
        setState('dirty')
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => void flush(value), 650)
      }

      const statusText =
        state === 'saving' ? t('notes.saving')
        : state === 'saved' ? t('notes.saved')
        : state === 'error' ? t('notes.error')
        : state === 'dirty' ? t('notes.dirty')
        : ''

      return h(
        'section',
        { className: 'dshsb-pane', style: { height } },
        h(
          'div',
          { className: 'dshsb-head' },
          h('span', { className: 'dshsb-head-ico' }, h(Glyph.note, { size: 12 })),
          h('span', { className: 'dshsb-head-title' }, t('notes.title')),
          h(
            'span',
            { className: 'dshsb-head-meta' },
            h(
              'span',
              { className: 'dshsb-save', 'data-state': state },
              h('span', { className: 'dshsb-dot' }),
              statusText,
            ),
            h('span', { className: 'dshsb-meta-text' },
              t('notes.chars').replace('{n}', String(text.length))),
          ),
        ),
        h(
          'div',
          { className: 'dshsb-note-wrap' },
          h(
            'div',
            { className: 'dshsb-note' },
            h('textarea', {
              value: text,
              spellCheck: false,
              placeholder: t('notes.placeholder'),
              onChange: (event) => onChange(event.target.value),
              onBlur: () => {
                window.clearTimeout(timer.current)
                void flush(latest.current)
              },
            }),
          ),
        ),
      )
    }

    // ── git ─────────────────────────────────────────────────────────────────
    /** A huge diff must not become tens of thousands of DOM nodes. */
    const MAX_DIFF_LINES = 400

    function DiffBlock(props) {
      const lines = String(props.text ?? '').split('\n')
      const shown = lines.length > MAX_DIFF_LINES ? lines.slice(0, MAX_DIFF_LINES) : lines
      const hidden = lines.length - shown.length
      return h(
        'div',
        { className: 'dshsb-diff' },
        h(
          'pre',
          null,
          shown.map((line, index) => {
            const tone =
              line.startsWith('+++') || line.startsWith('---') ? 'meta'
              : line.startsWith('@@') ? 'hunk'
              : line.startsWith('+') ? 'add'
              : line.startsWith('-') ? 'del'
              : line.startsWith('diff ') || line.startsWith('index ') ? 'meta'
              : undefined
            return h('div', { key: index, className: 'dshsb-dl', 'data-t': tone }, line || ' ')
          }),
          hidden > 0
            ? h('div', { key: 'more', className: 'dshsb-dl', 'data-t': 'meta' },
                String(props.more ?? '').replace('{n}', String(hidden)))
            : null,
        ),
      )
    }

    function FileRow(props) {
      const { file, t, onStage, onUnstage, onDiscard, onDiff, active } = props
      const slash = file.path.lastIndexOf('/')
      const dir = slash > 0 ? file.path.slice(0, slash + 1) : ''
      const name = slash > 0 ? file.path.slice(slash + 1) : file.path
      return h(
        'div',
        { className: 'dshsb-row', 'data-active': active ? '' : undefined, title: file.path },
        h('span', { className: 'dshsb-rowico' }, h(Glyph.file, { size: 12 })),
        h(
          'button',
          { type: 'button', className: 'dshsb-file', onClick: onDiff },
          dir ? h('em', null, dir) : null,
          name,
        ),
        h(
          'span',
          { className: 'dshsb-rowacts' },
          file.staged
            ? h('button', { type: 'button', className: 'dshsb-tiny', title: t('git.unstage'), onClick: onUnstage },
                h(Glyph.minus, { size: 10 }))
            : h('button', { type: 'button', className: 'dshsb-tiny', title: t('git.stage'), onClick: onStage },
                h(Glyph.plus, { size: 10 })),
          h('button', { type: 'button', className: 'dshsb-tiny', 'data-danger': '', title: t('git.discard'), onClick: onDiscard },
            h(Glyph.undo, { size: 10 })),
        ),
        h('span', { className: 'dshsb-state', 'data-kind': file.kind }, file.code),
      )
    }

    function GitPane(props) {
      const { sessionId, t, status, branches, reload } = props
      const [message, setMessage] = React.useState(() => readCommitDraft(sessionId))
      const [busy, setBusy] = React.useState('')

      React.useEffect(() => {
        setMessage(readCommitDraft(sessionId))
      }, [sessionId])
      const [diff, setDiff] = React.useState(null)
      const [menu, setMenu] = React.useState(false)
      const [newBranch, setNewBranch] = React.useState('')
      const [toast, showToast] = useToast()

      const run = React.useCallback(
        async (action, extra, successLabel) => {
          setBusy(action)
          try {
            const result = await api.git(sessionId, action, extra)
            await reload?.()
            if (result?.ok) showToast(successLabel ?? t('git.done'), 'ok')
            else showToast(String(result?.stderr || result?.error || t('git.failedAction')).slice(0, 160), 'err')
            return result
          } catch (cause) {
            showToast(String(cause?.message ?? cause).slice(0, 160), 'err')
            return null
          } finally {
            setBusy('')
          }
        },
        [sessionId, reload, showToast, t],
      )

      const files = Array.isArray(status?.files) ? status.files : []
      const staged = files.filter((file) => file.staged)
      const changed = files.filter((file) => !file.staged)
      const canCommit = message.trim().length > 0 && files.length > 0 && busy === ''
      const notRepo = status?.ok === false && status.reason === 'no-repo'
      const gitMissing = status?.ok === false && status.reason === 'git-missing'

      const openDiff = async (file) => {
        if (diff?.path === file.path && diff?.staged === file.staged) {
          setDiff(null)
          return
        }
        try {
          const body = await api.diff(sessionId, file.path, file.staged)
          setDiff({ path: file.path, staged: file.staged, text: body?.diff ?? '' })
        } catch (cause) {
          showToast(String(cause?.message ?? cause).slice(0, 160), 'err')
        }
      }

      const commit = () => {
        if (!canCommit) return
        const all = staged.length === 0
        void run('commit', { message: message.trim(), all }, t('git.done')).then((result) => {
          if (result?.ok) {
            setMessage('')
            clearCommitDraft(sessionId)
          }
        })
      }

      const rowProps = (file) => ({
        key: `${file.staged ? 's' : 'w'}:${file.path}`,
        file,
        t,
        active: diff?.path === file.path && diff?.staged === file.staged,
        onDiff: () => void openDiff(file),
        onStage: () => void run('stage', { paths: [file.path] }, t('git.done')),
        onUnstage: () => void run('unstage', { paths: [file.path] }, t('git.done')),
        onDiscard: () => {
          if (!window.confirm(t('git.confirmDiscard'))) return
          const untracked = file.kind === 'untracked'
          void run('discard', {
            paths: untracked ? [] : [file.path],
            untracked: untracked ? [file.path] : [],
          }, t('git.done'))
        },
      })

      /** One Source-Control group: a header with its count and bulk action, then its rows. */
      const group = (label, rows, glyph, title, action) =>
        rows.length === 0
          ? null
          : h(
              React.Fragment,
              { key: label },
              h(
                'div',
                { className: 'dshsb-group' },
                h('span', { className: 'dshsb-group-name' }, label),
                h('span', { className: 'dshsb-count' }, rows.length),
                h('span', { className: 'dshsb-gline' }),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dshsb-tiny',
                    title,
                    onClick: () => void run(action, { paths: rows.map((file) => file.path) }, t('git.done')),
                  },
                  h(glyph, { size: 10 }),
                ),
              ),
              rows.map((file) => h(FileRow, rowProps(file))),
            )

      const headMeta = []
      if (status?.ok) {
        headMeta.push(
          h(
            'button',
            {
              key: 'branch',
              type: 'button',
              className: 'dshsb-branchbtn',
              title: t('git.branchSwitch'),
              onClick: () => setMenu((open) => !open),
            },
            h(Glyph.branch, { size: 11 }),
            h('span', null, status.branch || 'HEAD'),
          ),
        )
        if (status.ahead > 0) {
          headMeta.push(h('span', { key: 'ahead', className: 'dshsb-chip', 'data-tone': 'ok' },
            h(Glyph.up, { size: 9 }), status.ahead))
        }
        if (status.behind > 0) {
          headMeta.push(h('span', { key: 'behind', className: 'dshsb-chip', 'data-tone': 'warn' },
            h(Glyph.down, { size: 9 }), status.behind))
        }
      }

      return h(
        'section',
        { className: 'dshsb-pane dshsb-pane--grow', style: { position: 'relative' } },
        h(
          'div',
          { className: 'dshsb-head' },
          h('span', { className: 'dshsb-head-ico' }, h(Glyph.branch, { size: 12 })),
          h('span', { className: 'dshsb-head-title' }, t('git.title')),
          h('span', { className: 'dshsb-head-meta' }, headMeta),
          h(IconButton, {
            title: t('common.refresh'),
            glyph: Glyph.refresh,
            busy: busy === 'refresh',
            onClick: () => void reload?.(),
          }),
        ),

        notRepo
          ? h(
              'div',
              { className: 'dshsb-init' },
              h('div', { className: 'dshsb-init-ico' }, h(Glyph.repo, { size: 18 })),
              h('div', { className: 'dshsb-init-title' }, t('git.notRepo')),
              h('div', { className: 'dshsb-init-hint' }, t('git.notRepoHint')),
              h(Btn, {
                variant: 'primary',
                glyph: busy === 'init' ? Glyph.refresh : Glyph.plus,
                busy: busy === 'init',
                disabled: busy !== '',
                onClick: () => void run('init', {}, t('git.done')),
              }, busy === 'init' ? t('git.initializing') : t('git.init')),
            )
          : gitMissing
            ? h(
                'div',
                { className: 'dshsb-init' },
                h('div', { className: 'dshsb-init-ico' }, h(Glyph.warn, { size: 18 })),
                h('div', { className: 'dshsb-init-title' }, t('git.gitMissing')),
                h('div', { className: 'dshsb-init-hint' }, t('git.gitMissingHint')),
              )
            : status?.ok === false
              ? h(
                  'div',
                  { className: 'dshsb-init' },
                  h('div', { className: 'dshsb-init-ico' }, h(Glyph.warn, { size: 18 })),
                  h('div', { className: 'dshsb-init-title' }, t('git.failed')),
                  h('div', { className: 'dshsb-err' }, String(status.message ?? '').slice(0, 240)),
                  h(Btn, { variant: 'quiet', onClick: () => void reload?.() }, t('common.retry')),
                )
              : h(
                  React.Fragment,
                  null,
                  h(
                    'div',
                    { className: 'dshsb-commit-msg' },
                    h('input', {
                      className: 'dshsb-field dshsb-commit-input',
                      value: message,
                      spellCheck: false,
                      placeholder: t('git.commitPlaceholder'),
                      onChange: (event) => {
                        const value = event.target.value
                        setMessage(value)
                        writeCommitDraft(sessionId, value)
                      },
                      onKeyDown: (event) => {
                        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                          event.preventDefault()
                          commit()
                        }
                      },
                    }),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'dshsb-btn dshsb-commit-btn',
                        'data-variant': 'primary',
                        title: t('git.commitHint'),
                        disabled: !canCommit,
                        onClick: commit,
                      },
                      busy === 'commit' ? h(Glyph.refresh, { size: 11, style: spin }) : null,
                      t('git.commit'),
                    ),
                  ),
                  h(
                    'div',
                    { className: 'dshsb-git-body' },
                    status === null
                      ? h('div', { className: 'dshsb-clean' }, t('git.loading'))
                      : files.length === 0
                        ? h(
                            'div',
                            { className: 'dshsb-clean' },
                            h('div', { className: 'dshsb-clean-ico' }, h(Glyph.check, { size: 15 })),
                            h('div', null, t('git.clean')),
                          )
                        : h(
                            React.Fragment,
                            null,
                            group(t('git.staged'), staged, Glyph.minus, t('git.unstageAll'), 'unstage'),
                            group(t('git.changes'), changed, Glyph.plus, t('git.stageAll'), 'stage'),
                            diff ? h(DiffBlock, { text: diff.text, more: t('git.diffMore') }) : null,
                          ),
                  ),
                  h(
                    'div',
                    { className: 'dshsb-actions' },
                    h(Btn, {
                      variant: 'quiet',
                      glyph: Glyph.cloud,
                      busy: busy === 'push',
                      disabled: busy !== '',
                      onClick: () => void run('push', {}, t('git.done')),
                    }, t('git.push')),
                    h(Btn, {
                      variant: 'quiet',
                      glyph: Glyph.down,
                      disabled: busy !== '',
                      onClick: () => void run('pull', {}, t('git.done')),
                    }, t('git.pull')),
                    h(Btn, {
                      variant: 'quiet',
                      glyph: Glyph.refresh,
                      busy: busy === 'fetch',
                      disabled: busy !== '',
                      onClick: () => void run('fetch', {}, t('git.done')),
                    }, t('git.fetch')),
                  ),
                ),

        menu
          ? h(
              React.Fragment,
              null,
              h('div', { className: 'dshsb-menu-backdrop', onClick: () => setMenu(false) }),
              h(
                'div',
                { className: 'dshsb-menu' },
                h('div', { className: 'dshsb-menu-label' }, t('git.branchSwitch')),
                h(
                  'div',
                  { className: 'dshsb-menu-list' },
                  branches.length === 0
                    ? h('div', { className: 'dshsb-menu-label' }, t('git.noBranches'))
                    : branches.map((branch) =>
                        h(
                          'button',
                          {
                            key: branch.name,
                            type: 'button',
                            className: 'dshsb-menu-row',
                            'data-current': branch.current ? '' : undefined,
                            onClick: () => {
                              setMenu(false)
                              if (!branch.current) void run('checkout', { branch: branch.name }, t('git.done'))
                            },
                          },
                          branch.current ? h(Glyph.check, { size: 10 }) : h(Glyph.branch, { size: 10 }),
                          h('span', null, branch.name),
                        )),
                ),
                h(
                  'div',
                  { className: 'dshsb-menu-new' },
                  h('input', {
                    className: 'dshsb-field',
                    value: newBranch,
                    placeholder: t('git.branchNewPlaceholder'),
                    onChange: (event) => setNewBranch(event.target.value),
                    onKeyDown: (event) => {
                      if (event.key === 'Enter' && newBranch.trim()) {
                        setMenu(false)
                        void run('createBranch', { branch: newBranch.trim() }, t('git.done')).then(() => setNewBranch(''))
                      }
                    },
                  }),
                  h(Btn, {
                    variant: 'quiet',
                    disabled: newBranch.trim() === '' || busy !== '',
                    onClick: () => {
                      setMenu(false)
                      void run('createBranch', { branch: newBranch.trim() }, t('git.done')).then(() => setNewBranch(''))
                    },
                  }, t('git.branchCreate')),
                ),
              ),
            )
          : null,
        h(Toast, { toast }),
      )
    }

    // ── commit graph ────────────────────────────────────────────────────────
    function HistoryPane(props) {
      const { t, commits, error, height } = props
      const [hoveredHash, setHoveredHash] = React.useState(null)
      const [expandedHash, setExpandedHash] = React.useState(null)

      const renderCommit = (commit, index) => {
        const additions = Number(commit.additions ?? 0) || 0
        const deletions = Number(commit.deletions ?? 0) || 0
        const files = Number(commit.files ?? (Array.isArray(commit.fileStats) ? commit.fileStats.length : 0)) || 0
        const hasStats = commit.additions !== undefined || commit.deletions !== undefined || Array.isArray(commit.fileStats)
        const expanded = expandedHash === commit.hash
        const statsVisible = hasStats && (hoveredHash === commit.hash || expanded)
        const fileStats = Array.isArray(commit.fileStats) ? commit.fileStats : []

        return h(
          React.Fragment,
          { key: commit.hash },
          h(
            'div',
            {
              className: 'dshsb-commit-row',
              'data-head': index === 0 ? '' : undefined,
              title: `${commit.hash} · ${commit.author} · ${commit.when}`,
              onMouseEnter: () => setHoveredHash(commit.hash),
              onMouseLeave: () => setHoveredHash((current) => current === commit.hash ? null : current),
              onClick: () => setExpandedHash((current) => current === commit.hash ? null : commit.hash),
            },
            h('span', { className: 'dshsb-graph' }, h('i')),
            h(
              'span',
              { className: 'dshsb-commit-text' },
              h('span', { className: 'dshsb-commit-subject' }, commit.subject),
              h(
                'span',
                { className: 'dshsb-commit-meta' },
                h('span', { className: 'dshsb-hash' }, commit.hash),
                (commit.parents ?? []).length > 1
                  ? h('span', { className: 'dshsb-merge', title: t('history.merge') }, h(Glyph.fork, { size: 9 }))
                  : null,
                h('span', null, commit.author),
                h('span', { style: { opacity: 0.6 } }, commit.when),
              ),
              statsVisible
                ? h(
                    'span',
                    { className: 'dshsb-commit-stats' },
                    additions > 0 ? h('span', { className: 'dshsb-stat-add' }, `+${additions}`) : null,
                    deletions > 0 ? h('span', { className: 'dshsb-stat-del' }, `-${deletions}`) : null,
                    h('span', { className: 'dshsb-stat-files' }, t('history.files').replace('{n}', String(files))),
                  )
                : null,
            ),
          ),
          expanded && fileStats.length > 0
            ? h(
                'div',
                { className: 'dshsb-commit-detail' },
                fileStats.map((file, fileIndex) =>
                  h(
                    'div',
                    { key: `${commit.hash}:${fileIndex}`, className: 'dshsb-commit-file' },
                    h('span', { className: 'dshsb-commit-file-name', title: file.path }, file.path),
                    h(
                      'span',
                      { className: 'dshsb-commit-file-stat' },
                      file.binary
                        ? h('span', { className: 'dshsb-stat-files' }, t('history.binary'))
                        : [
                            file.additions > 0 ? h('span', { key: 'add', className: 'dshsb-stat-add' }, `+${file.additions}`) : null,
                            file.deletions > 0 ? h('span', { key: 'del', className: 'dshsb-stat-del' }, `-${file.deletions}`) : null,
                          ],
                    ),
                  )),
              )
            : null,
        )
      }

      return h(
        'section',
        { className: 'dshsb-pane', style: { height } },
        h(
          'div',
          { className: 'dshsb-head' },
          h('span', { className: 'dshsb-head-ico' }, h(Glyph.clock, { size: 12 })),
          h('span', { className: 'dshsb-head-title' }, t('history.title')),
          h(
            'span',
            { className: 'dshsb-head-meta' },
            commits.length > 0 ? h('span', { className: 'dshsb-count' }, commits.length) : null,
          ),
        ),
        h(
          'div',
          { className: 'dshsb-hist-body' },
          commits.length === 0
            ? error
              ? h('div', { className: 'dshsb-clean dshsb-clean--err' }, error)
              : h('div', { className: 'dshsb-clean' }, t('history.empty'))
            : commits.map(renderCommit),
        ),
      )
    }

    // ── browser ─────────────────────────────────────────────────────────────
    const IFRAME_SANDBOX = 'allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox'
    /** Page state outlives a mode switch; the cap keeps it from outliving the Session. */
    const browserMemory = new Map()
    const BROWSER_MEMORY_LIMIT = 12
    let browserSeq = 1

    function normalizeAddress(raw) {
      const value = String(raw ?? '').trim()
      if (!value) return ''
      if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) return value
      if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?(\/|$)/i.test(value)) return `http://${value}`
      if (/^[\w.-]+\.\w{2,}(:\d+)?(\/|$)/.test(value)) return `https://${value}`
      return `https://${value}`
    }

    function titleFor(url) {
      try {
        const parsed = new URL(url)
        return parsed.hostname || url
      } catch {
        return url
      }
    }

    const newPage = () => ({ id: browserSeq++, url: '', title: '', nonce: 0 })

    function BrowserPane(props) {
      const { sessionId, t, fill, height, onClose } = props
      const remembered = browserMemory.get(sessionId)
      const [tabs, setTabs] = React.useState(() => remembered?.tabs ?? [newPage()])
      const [activeId, setActiveId] = React.useState(() => remembered?.activeId ?? tabs[0].id)
      const [address, setAddress] = React.useState(() => remembered?.address ?? '')

      React.useEffect(() => {
        // Keep this Session's pages, evicting the least recently used one so the
        // cache cannot outgrow the Sessions the page has visited.
        browserMemory.delete(sessionId)
        browserMemory.set(sessionId, { tabs, activeId, address })
        if (browserMemory.size > BROWSER_MEMORY_LIMIT) {
          browserMemory.delete(browserMemory.keys().next().value)
        }
      }, [sessionId, tabs, activeId, address])

      const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0]

      const go = (raw) => {
        const url = normalizeAddress(raw)
        if (!url) return
        setTabs((current) =>
          current.map((tab) =>
            tab.id === active?.id ? { ...tab, url, title: titleFor(url), nonce: tab.nonce + 1 } : tab))
        setAddress(url)
      }

      const addTab = () => {
        const tab = newPage()
        setTabs((current) => [...current, tab])
        setActiveId(tab.id)
        setAddress('')
      }

      const closeTab = (id) => {
        const next = tabs.filter((tab) => tab.id !== id)
        if (next.length === 0) {
          const tab = newPage()
          setTabs([tab])
          setActiveId(tab.id)
          setAddress('')
          return
        }
        setTabs(next)
        if (id === activeId) {
          const last = next[next.length - 1]
          setActiveId(last.id)
          setAddress(last.url)
        }
      }

      const reload = () => {
        if (!active?.url) return
        setTabs((current) =>
          current.map((tab) => (tab.id === active.id ? { ...tab, nonce: tab.nonce + 1 } : tab)))
      }

      return h(
        'section',
        { className: fill ? 'dshsb-browser dshsb-browser--fill' : 'dshsb-browser', style: fill ? undefined : { height } },
        h(
          'div',
          { className: 'dshsb-head', style: { borderBottom: 'none', height: 28 } },
          h('span', { className: 'dshsb-head-ico' }, h(Glyph.globe, { size: 12 })),
          h('span', { className: 'dshsb-head-title' }, t('browser.title')),
          h(
            'span',
            { className: 'dshsb-head-meta' },
            h(IconButton, { title: t('browser.reload'), glyph: Glyph.refresh, onClick: reload, disabled: !active?.url }),
            h(IconButton, { title: t('browser.closeTab'), glyph: Glyph.close, onClick: onClose }),
          ),
        ),
        h(
          'div',
          { className: 'dshsb-tabs' },
          tabs.map((tab) =>
            h(
              'div',
              { key: tab.id, className: 'dshsb-tab', 'data-active': tab.id === active?.id ? '' : undefined },
              h(
                'button',
                {
                  type: 'button',
                  className: 'dshsb-tab-name',
                  title: tab.url || t('browser.newTab'),
                  onClick: () => {
                    setActiveId(tab.id)
                    setAddress(tab.url)
                  },
                },
                tab.title || t('browser.newTab'),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dshsb-tab-x',
                  title: t('browser.closeTab'),
                  onClick: (event) => {
                    event.stopPropagation()
                    closeTab(tab.id)
                  },
                },
                h(Glyph.close, { size: 8 }),
              ),
            )),
          h('button', { type: 'button', className: 'dshsb-tiny', title: t('browser.newTab'), onClick: addTab },
            h(Glyph.plus, { size: 11 })),
        ),
        h(
          'div',
          { className: 'dshsb-addr' },
          h('input', {
            value: address,
            spellCheck: false,
            placeholder: t('browser.placeholder'),
            onChange: (event) => setAddress(event.target.value),
            onKeyDown: (event) => {
              if (event.key === 'Enter') go(address)
            },
          }),
          h(Btn, { variant: 'quiet', onClick: () => go(address) }, t('browser.go')),
        ),
        h(
          'div',
          { className: 'dshsb-frame' },
          active?.url
            ? h('iframe', {
                key: `${active.id}:${active.nonce}`,
                src: active.url,
                title: active.title || t('browser.title'),
                sandbox: IFRAME_SANDBOX,
                referrerPolicy: 'no-referrer',
              })
            : h(
                'div',
                { className: 'dshsb-frameless' },
                h(Glyph.globe, { size: 20, style: { opacity: 0.55 } }),
                h('div', null, t('browser.empty')),
                h('div', { style: { opacity: 0.66, maxWidth: 230 } }, t('browser.hint')),
              ),
        ),
      )
    }

    // ── crash guard ─────────────────────────────────────────────────────────
    /**
     * Keep one broken render from blanking the column: the slot owner shows
     * nothing when an entry throws, so the entry has to say what happened.
     */
    class PanelGuard extends React.Component {
      constructor(props) {
        super(props)
        this.state = { error: null }
      }

      static getDerivedStateFromError(error) {
        return { error }
      }

      componentDidCatch(error) {
        console.error('dsh-sidebar: panel render failed', error)
      }

      render() {
        if (this.state.error) {
          return h(
            'div',
            { className: 'dshsb-crash' },
            h('div', { className: 'dshsb-crash-title' }, '侧栏渲染失败'),
            h('div', { className: 'dshsb-crash-text' }, String(this.state.error?.stack ?? this.state.error).slice(0, 1200)),
          )
        }
        return this.props.children
      }
    }

    function Panel(props) {
      return h(PanelGuard, null, h(Workbench, props))
    }

    // ── panel ───────────────────────────────────────────────────────────────
    function Workbench(props) {
      const { sessionId, t, useSession } = props
      const [sizes, setSizes] = React.useState(readSizes)
      const [browserOpen, setBrowserOpen] = React.useState(false)
      const [status, setStatus] = React.useState(null)
      const [commits, setCommits] = React.useState([])
      const [logError, setLogError] = React.useState('')
      const [branches, setBranches] = React.useState([])
      const panelRef = React.useRef(null)
      const fingerprint = React.useRef('')

      // The Host cannot answer for a Session whose history has not opened yet; asking
      // early is what reported the app's own directory as "not a repository".
      const openState = typeof useSession === 'function'
        ? useSession((snapshot) => snapshot.openState)
        : 'open'
      const ready = sessionReady(openState)

      React.useEffect(() => {
        try {
          window.localStorage.setItem(SIZES_KEY, JSON.stringify(sizes))
        } catch {
          // a full or blocked store keeps the session's sizes in memory only
        }
      }, [sizes])

      const reload = React.useCallback(async () => {
        const [nextStatus, nextLog, nextBranches] = await Promise.all([
          api.status(sessionId).catch((cause) => ({ ok: false, reason: 'failed', message: String(cause?.message ?? cause) })),
          api.log(sessionId).catch(() => ({ commits: [] })),
          api.branches(sessionId).catch(() => ({ branches: [] })),
        ])
        fingerprint.current = gitFingerprint(nextStatus)
        setStatus(nextStatus)
        setCommits(Array.isArray(nextLog?.commits) ? nextLog.commits : [])
        setLogError(
          nextLog?.ok === false && nextLog.reason !== 'no-commits'
            ? String(nextLog?.message ?? 'git log failed')
            : '',
        )
        setBranches(Array.isArray(nextBranches?.branches) ? nextBranches.branches : [])
      }, [sessionId])

      /** Cheap probe: only a changed verdict pays for the full reload. */
      const probe = React.useCallback(async () => {
        if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
        const nextStatus = await api.status(sessionId).catch(() => null)
        if (!nextStatus || gitFingerprint(nextStatus) === fingerprint.current) return
        await reload()
      }, [reload, sessionId])

      React.useEffect(() => {
        if (!ready) return
        void reload()
        const timer = window.setInterval(() => void probe(), GIT_POLL_MS)
        return () => window.clearInterval(timer)
      }, [ready, reload, probe])

      // Returning to the window is a user-visible moment: refresh at once instead
      // of waiting for the next tick.
      React.useEffect(() => {
        if (!ready) return
        const refresh = () => {
          if (document.visibilityState === 'visible') void probe()
        }
        window.addEventListener('focus', refresh)
        document.addEventListener('visibilitychange', refresh)
        return () => {
          window.removeEventListener('focus', refresh)
          document.removeEventListener('visibilitychange', refresh)
        }
      }, [ready, probe])

      const panelHeight = () => panelRef.current?.clientHeight ?? 640

      // The grow pane (git) keeps a floor of 168px, so every fixed pane's ceiling
      // is whatever is left once the other fixed panes and that floor are taken.
      const ceiling = (key, min) => {
        const others = sizes.notes + sizes.history - (sizes[key] ?? 0)
        return Math.max(min + 24, panelHeight() - others - 168)
      }

      const nudge = (key, dy, min) => {
        setSizes((current) => {
          const max = ceiling(key, min)
          const value = clamp((current[key] ?? 0) + dy, min, max)
          return value === current[key] ? current : { ...current, [key]: value }
        })
      }

      // The browser replaces the whole column rather than stacking inside it, so the
      // toggle swaps one subtree for another instead of changing a pane height.
      const toggleBrowser = () => setBrowserOpen((open) => !open)

      const repo = status?.root || status?.cwd || ''

      return h(
        'div',
        { className: 'dshsb-root', ref: panelRef },

        h(
          'div',
          { className: 'dshsb-top' },
          h('span', { className: 'dshsb-top-name' }, t('top.workbench')),
          h('span', { className: 'dshsb-repo', title: repo }, repo),
          h(IconButton, {
            title: t('top.browser'),
            glyph: Glyph.globe,
            on: browserOpen,
            onClick: toggleBrowser,
          }),
        ),

        browserOpen
          ? h(BrowserPane, {
              sessionId,
              t,
              fill: true,
              onClose: () => setBrowserOpen(false),
            })
          : h(
              React.Fragment,
              null,
              h(NotesPane, { sessionId, t, height: sizes.notes }),
              h(Splitter, {
                label: t('notes.title'),
                onDelta: (dy) => nudge('notes', dy, 104),
              }),
              h(GitPane, { sessionId, t, status, branches, reload }),
              h(Splitter, {
                label: t('history.title'),
                onDelta: (dy) => nudge('history', -dy, 84),
              }),
              h(HistoryPane, { t, commits, error: logError, height: sizes.history }),
            ),
      )
    }

    // ── apply ───────────────────────────────────────────────────────────────
    /**
     * Open the workbench for the on-screen Session when it does not show it yet.
     *
     * The controller only places a tab once that Session's store is adopted, which
     * happens a render after the frame reports it, so an attempt that lands too
     * early is retried briefly instead of being lost.
     */
    function autoOpen(ctx) {
      // The user closed the column last time: keep it closed instead of forcing
      // a fresh tab (which would expand it at the 45% default again).
      if (!shouldAutoOpenRightbar()) return
      const controller = ctx.get?.('sidebarRight')
      if (!controller || typeof controller.openTabIn !== 'function') return

      // Only the on-screen Session is ever retried, so one counter is enough:
      // a Map here would grow with every Session the page ever visited.
      let tries = { sessionId: '', count: 0 }
      let timer = 0

      const showsWorkbench = (sessionId) => {
        try {
          const tabs = controller.tabsIn?.(sessionId) ?? []
          return tabs.some((tab) => tab?.kind === KIND)
        } catch {
          return false
        }
      }

      const attempt = () => {
        const sessionId = controller.mounted?.getSnapshot?.()
        if (typeof sessionId !== 'string' || showsWorkbench(sessionId)) return
        if (tries.sessionId !== sessionId) tries = { sessionId, count: 0 }
        if (tries.count >= 4) return
        tries.count += 1
        try {
          controller.openTabIn(sessionId, KIND)
        } catch {
          // a store that is not adopted yet throws; the retry below covers it
        }
        if (!showsWorkbench(sessionId)) {
          window.clearTimeout(timer)
          timer = window.setTimeout(attempt, 350)
        }
      }

      const unsubscribe = controller.mounted?.subscribe?.(() => {
        window.clearTimeout(timer)
        timer = window.setTimeout(attempt, 60)
      })
      timer = window.setTimeout(attempt, 300)

      return () => {
        window.clearTimeout(timer)
        if (typeof unsubscribe === 'function') unsubscribe()
      }
    }

    function apply(ctx) {
      const install = (scope) => {
        const t = scope.locale.bind(NS)
        scope.effect(() => scope.locale.register(NS, { zh, en }), 'dsh-sidebar: dictionaries')

        // One stylesheet for the whole page: the right column keeps several
        // Session views mounted, and a style tag per panel would duplicate it.
        scope.effect(() => {
          const style = document.createElement('style')
          style.setAttribute('data-dsh-sidebar', '')
          style.textContent = CSS
          document.head.appendChild(style)
          return () => style.remove()
        }, 'dsh-sidebar: stylesheet')

        scope.effect(
          () =>
            scope.sidebarRightTabs.register({
              id: ID,
              kind: KIND,
              priority: 'extension',
              multiple: false,
              title: () => t('tab.title'),
              guide: [
                {
                  id: 'open',
                  order: 12,
                  title: () => t('guide.title'),
                  description: () => t('guide.description'),
                },
              ],
            }),
          'dsh-sidebar: tab type',
        )

        scope.effect(
          () =>
            scope.slots.inject('sidebar.right.pane.tab', () =>
              scope.slots.register({ name: 'sidebar.right.pane.tab', key: ID, locale: NS }, Panel)),
          'dsh-sidebar: tab body',
        )

        // Must install before anything opens the column: the replay inside the
        // bridge is what keeps the first open from falling back to 45%.
        scope.effect(
          () => bridgeRightbarLayout(scope.get?.('layout')),
          'dsh-sidebar: rightbar layout memory',
        )

        scope.effect(() => autoOpen(scope), 'dsh-sidebar: auto open')
      }

      if (typeof ctx.inject === 'function') ctx.inject(['locale', 'sidebarRightTabs'], install)
      else install(ctx)
    }

    return {
      inject: ['slots'],
      apply,
      __test: {
        bridgeRightbarLayout,
        gitFingerprint,
        readRightbarLayout,
        sessionReady,
        shouldAutoOpenRightbar,
      },
    }
  },
})
