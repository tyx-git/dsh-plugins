# dsh-sidebar

Right-column workbench for the Harness Web UI. It contributes one right-Sidebar
tab type (`dsh-sidebar`) whose body is a stack of resizable panes.

| Pane | What it does |
| --- | --- |
| Notes | A fixed-height, scrollable scratch pad per Session, saved to the host 650 ms after the last keystroke and flushed on unmount. |
| Git | Source-Control layout: one row of commit input + **提交**, then the `暂存的更改` / `更改` groups (count, bulk stage/unstage, per-file icon → name → hover actions → status letter), a diff viewer, and push / pull / fetch at the foot. An uninitialised folder offers **初始化仓库**. |
| Commits | The commit graph: spine, nodes, HEAD marker, merge glyph, hash, author and relative time. |
| Browser | The globe in the top bar swaps the whole column for the browser (page strip, address bar, sandboxed iframe) and swaps it back; the page state survives the round trip. |

Every pane between the top bar and the browser has a drag handle: drag it (or
focus it and press ↑/↓) to resize, and the sizes are remembered in
`localStorage` under `dsh-sidebar:sizes:v1`. The git pane is the grow pane; the
fixed panes clamp so it always keeps a 168 px floor.

## Typography

No type value is written by hand. The panel sets
`font: var(--dsw-font-xxs-12)` and every child picks a step of the Harness scale
(`--dsw-font-xxxs-11`, `--dsw-font-xxs-strong-12`, `--dsw-font-xs-13`,
`--dsw-font-markdown-code-block`), so text follows the host's family, weight and
size — including the font-size setting in Settings → Appearance. Code, paths and
hashes use `--ds-font-family-code`.

## Host routes

The browser half calls these same-origin JSON routes; the host half owns them
under one `ctx.effect`:

```
GET  /dsh-sidebar/git?sessionId=            branch, upstream, ahead/behind, changes
GET  /dsh-sidebar/git/log?sessionId&limit   recent commits with their parents
GET  /dsh-sidebar/git/branches?sessionId=   local branches
GET  /dsh-sidebar/git/diff?sessionId&path&staged
POST /dsh-sidebar/git                       init | stage | unstage | discard | commit |
                                            push | pull | fetch | checkout | createBranch
GET  /dsh-sidebar/notes?sessionId=          the Session's notes
POST /dsh-sidebar/notes                     replace them
```

A file path is re-anchored on the Session's working directory and refused when
it escapes; a request whose `Origin` names another host is refused too. Notes
live in `<dsh home>/dsh-sidebar/notes.json`, never inside a user workspace.

## Resources

Everything the panel starts is owned by something that ends:

- Timers: one toast timer and one notes debounce per panel, cleared on unmount;
  the auto-open retry timer is cleared by its `ctx.effect` disposer.
- Subscriptions: exactly one (`sidebarRight.mounted`), unsubscribed on dispose.
- No `addEventListener`, `setInterval`, observer or streaming fetch anywhere.
- `browserMemory` (page state kept across the browser mode switch) is an LRU
  capped at 12 Sessions; the auto-open retry keeps one counter, not a map.
- The stylesheet is injected once per page through `ctx.effect` and removed on
  dispose, instead of one `<style>` per mounted Session view.
- Diffs render at most 400 lines, with a `… 还有 N 行` tail.
- The right column's width and open state are remembered in
  `dsh-sidebar:rightbar-layout:v1`; writes are debounced because the frame
  reports a width every animation frame while dragging.
- Host: one route registration owned by one effect, no module-level caches.

Known limits: the notes store is a single JSON file rewritten synchronously on
each save (bounded by 200 KB per Session); a `git` child keeps running when the
browser aborts a fetch (each is short-lived and nothing retains it).

## Checks

```
node test/contract-test.mjs   # porcelain -z parsing, XY→row expansion, log/branch decoding, path containment
node test/style-test.mjs      # stylesheet balance, theme-token-only colours, class coverage
node test/resource-test.mjs   # timer/subscription balance, cache caps, single route registration
pwsh -NoProfile -File test/commit-untracked-regression.ps1  # untracked-file commit integration case
node test/commit-draft-regression.mjs  # Session-scoped commit-message draft contract
node test/rightbar-layout-regression.mjs  # right column width/open-state memory
```

## Limits

- The right column's width memory bridges `ctx.get('layout').panels`, the action
  object the frame's resize handle writes. That object is not part of the public
  Client layout contract, so a future Harness release could rename it; the bridge
  turns itself off (and keeps working) when the shape is missing.
- A site that sends `X-Frame-Options: DENY` or a restrictive `frame-ancestors`
  renders blank in the browser pane; that is the target's policy, not a defect.
- Git actions run the `git` executable from the host process's `PATH`. Without
  git installed the Git pane says so instead of failing silently.
- The tab type is an extension-band registration: it adds a right-Sidebar tab,
  it does not remove the shipped Files, Guide or Document tabs.
