# Zeonta — Post-v1 Todo

Features deferred from v1 scope. Source: [prd.md](prd.md) and [constitution.md](../constitution.md).

---

## Planned Features

- ✅ **Import / Export tools** — let users share tool definitions as files
- [ ] **Tool categories / tags** — organize tools in the sidebar by group
- ✅ **Execution history / logs** — persist a log of past runs with timestamps and output
- [ ] **Scheduled execution** — run tools automatically on a cron-like schedule
- [ ] **macOS / Linux support** — extend platform support beyond Windows
- [ ] **Go snippet: third-party package support** — create a temp go.mod and run `go get` so snippets can use packages beyond the standard library
- ✅ **Theme toggle** — switch between dark and light mode; persist the user's preference across sessions
- ✅ **Custom scrollbar** — replace the default OS scrollbar with a styled scrollbar that matches the app theme
- ✅ **Flexible UI layout** — redesign the shell into a VS Code-style layout with a left sidebar, right sidebar, bottom panel, and a main area; the main area supports tab-based navigation and can be split into two side-by-side panels; all panels are resizable by dragging and sizes persist across sessions (absorbs the adjustable panels item)
- ✅ **Tool versioning** — track a version number on each tool save; link history entries to the specific version that was run so users can review the exact script that produced a given output
- ✅ **Tab navigation history (Go Back / Go Forward)** — VS Code-style back/forward navigation through previously active tabs; keyboard shortcuts (Alt+Left / Alt+Right) and buttons in the title bar; navigates across both slots
- [ ] **Script editor enhancement** — replace the plain textarea in the tool edit form with a VS Code-like code editor (Monaco Editor); features: syntax highlighting per tool type (PowerShell/Go), line numbers, tab-to-indent, auto-indent on new line, bracket/quote auto-close
