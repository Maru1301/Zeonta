# Architecture — Zeonta 0.7.2

Defines the system structure, layer boundaries, storage design, and data flow.
Read alongside [ux.md](ux.md) (UI/UX) and [api.md](api.md) (method contracts).

---

## System Overview

```
┌─────────────────────────────────────────────────────┐
│                  Wails Desktop App                   │
│                                                      │
│  ┌─────────────────┐        ┌──────────────────────┐ │
│  │   Frontend      │        │   Backend (Go)        │ │
│  │   React + MUI   │◄──────►│   app.go              │ │
│  │   + Tailwind    │  Wails │                       │ │
│  │                 │  IPC   │   internal/            │ │
│  └─────────────────┘        │   ├── store/          │ │
│                             │   └── executor/       │ │
│                             │                       │ │
│                             │   zeonta.db (SQLite)  │ │
│                             └──────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Rule:** The frontend never accesses the filesystem or executes anything directly. All side effects go through Go via Wails bindings.

---

## Directory Structure

```
zeonta/
├── main.go                  # Wails entry point — initializes app and store; Frameless: true for custom title bar
├── app.go                   # All Go methods exposed to the frontend via Wails
├── internal/
│   ├── store/
│   │   ├── store.go            # Open DB, run schema migrations, expose Store struct
│   │   ├── tools.go            # CRUD: ListTools, GetTool, CreateTool, UpdateTool, DeleteTool
│   │   ├── versions.go         # Versioning + Trash: RecordVersion, ListVersions, GetVersion, RestoreToolVersion, ListDeletedTools, RestoreDeletedTool, ClearTrashByIDs
│   │   ├── environments.go     # CRUD + SetActiveEnvironment, GetActiveEnvVars
│   │   └── history.go          # RecordRun, ListHistory, GetHistoryEntry, ClearHistory
│   └── executor/
│       ├── executor.go         # Variable resolution, subprocess execution, output streaming
│       ├── proc_windows.go     # Windows: CREATE_NO_WINDOW flag to suppress console popup
│       └── proc_other.go       # Non-Windows: no-op stub
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── ContentArea/
│       │   │   ├── ContentArea.tsx
│       │   │   ├── EmptyState.tsx
│       │   │   └── ToolDetail.tsx
│       │   ├── EditPanel/
│       │   │   ├── CreatePanel.tsx       # New-tool form (opens as a tab)
│       │   │   └── ParamEditor.tsx
│       │   ├── Environments/
│       │   │   ├── EnvironmentPanel.tsx
│       │   │   └── EnvironmentEditPanel.tsx  # Edit/create environment (opens as a tab)
│       │   ├── Exports/
│       │   │   └── ExportPanel.tsx
│       │   ├── History/
│       │   │   └── HistoryPanel.tsx
│       │   ├── Layout/
│       │   │   ├── TitleBar.tsx          # Custom frameless title bar
│       │   │   ├── FunctionBar.tsx       # 48px icon rail (function switcher)
│       │   │   ├── SidePanel.tsx         # Collapsible content panel (renders active function)
│       │   │   ├── MainArea.tsx          # Tab slots container (1 or 2 slots)
│       │   │   ├── TabBar.tsx            # Tab strip for a single slot
│       │   │   ├── TabContent.tsx        # Renders the correct panel for a tab's kind
│       │   │   ├── TabSlot.tsx           # (stub)
│       │   │   ├── RightSidebar.tsx      # Version Panel wrapper (auto-syncs with active tab)
│       │   │   ├── ResizeHandle.tsx      # Draggable resize divider
│       │   │   ├── HistoryDetailPanel.tsx  # History entry detail (opens as a tab)
│       │   │   └── TrashDetailPanel.tsx    # Deleted tool detail (opens as a tab)
│       │   ├── Sidebar/
│       │   │   ├── ToolList.tsx
│       │   │   └── ToolListItem.tsx
│       │   ├── Versions/
│       │   │   ├── VersionPanel.tsx
│       │   │   └── TrashPanel.tsx
│       │   └── OutputPanel/
│       │       └── OutputPanel.tsx
│       ├── hooks/
│       │   ├── useResizable.ts   # localStorage-backed resizable size state
│       │   └── useNavHistory.ts  # tab navigation history stack (Go Back / Go Forward)
│       ├── types/
│       │   ├── tool.ts          # TypeScript types mirroring Go structs in api.md
│       │   └── tabs.ts          # TabKind, AppTab, SlotState, TabState, RightSidebarContent, ActiveFunction
│       └── App.tsx              # Root layout: TitleBar + FunctionBar + SidePanel + MainArea + RightSidebar + OutputPanel
├── wailsjs/                 # Auto-generated — do not edit
└── docs/                    # SDD specification documents
```

---

## Backend Architecture

### Layer Responsibilities

| Layer | File(s) | Responsibility |
|---|---|---|
| Binding layer | `app.go` | Implements all methods from `api.md`; delegates to store and executor |
| Storage layer | `internal/store/` | All SQLite reads and writes; no business logic |
| Execution layer | `internal/executor/` | Variable resolution, temp file creation, subprocess execution, output streaming |

**Dependency rule:** `executor` and `store` must not import each other. Both are imported only by `app.go`.

### `app.go`
- Holds `*store.Store` and `*executor.Executor` as struct fields on `App`
- Implements every method defined in `docs/api.md` with exactly those signatures
- Returns human-readable errors — never raw Go or SQLite error strings

### `internal/store`
- Opens the Zeonta data directory on startup, creating the file and directory if absent
- Runs schema migrations (`CREATE TABLE IF NOT EXISTS`) on every startup
- Never contains execution or business logic

### `internal/executor`
- Receives a fully-loaded `Tool` and a `RunInput` from `app.go`
- Performs variable resolution (see below)
- Writes the resolved script to a temp file, executes it, streams output via Wails events

---

## Database

**Driver:** `modernc.org/sqlite` (pure Go, no CGO, no C compiler required)

**Location:** `os.UserConfigDir()/Zeonta/zeonta.db`

| Platform | Resolved path |
|---|---|
| Windows | `%APPDATA%\Zeonta\zeonta.db` |
| macOS | `~/Library/Application Support/Zeonta/zeonta.db` |
| Linux | `~/.config/Zeonta/zeonta.db` |

**Schema:**

```sql
CREATE TABLE IF NOT EXISTS tools (
    id         TEXT    PRIMARY KEY,
    name       TEXT    UNIQUE NOT NULL,
    type       TEXT    NOT NULL,        -- "powershell" | "cmd" | "bash" | "applescript" | "python" | "go"
    body       TEXT    NOT NULL,
    created_at INTEGER NOT NULL         -- Unix timestamp
);

CREATE TABLE IF NOT EXISTS params (
    id          TEXT    PRIMARY KEY,
    tool_id     TEXT    NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    name        TEXT    NOT NULL,
    default_val TEXT    NOT NULL DEFAULT '',
    sort_order  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS environments (
    id        TEXT    PRIMARY KEY,
    name      TEXT    UNIQUE NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS env_entries (
    id             TEXT    PRIMARY KEY,
    environment_id TEXT    NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    key            TEXT    NOT NULL,
    value          TEXT    NOT NULL DEFAULT '',
    sort_order     INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS run_history (
    id         TEXT    PRIMARY KEY,
    tool_id    TEXT    NOT NULL,
    tool_name  TEXT    NOT NULL,  -- snapshot; preserved if tool is renamed or deleted
    ran_at     INTEGER NOT NULL,  -- Unix timestamp
    exit_code  INTEGER NOT NULL,
    output     TEXT    NOT NULL DEFAULT '',
    error      TEXT    NOT NULL DEFAULT '',
    version_id TEXT    NOT NULL DEFAULT ''  -- added via ALTER TABLE migration; empty for pre-existing rows
);

CREATE TABLE IF NOT EXISTS tool_versions (
    id       TEXT    PRIMARY KEY,
    tool_id  TEXT    NOT NULL,   -- intentionally no FK: versions survive tool deletion
    version  INTEGER NOT NULL,   -- auto-incremented per tool
    name     TEXT    NOT NULL,
    type     TEXT    NOT NULL,
    body     TEXT    NOT NULL,
    desc     TEXT    NOT NULL DEFAULT '',
    params   TEXT    NOT NULL DEFAULT '[]',  -- JSON array
    saved_at INTEGER NOT NULL
);

-- run_history.version_id was added via ALTER TABLE migration (empty string for pre-existing rows)
-- version_id references the tool_versions.id that was active when this run occurred
```

`ON DELETE CASCADE` ensures params are removed when a tool is deleted, and env entries are removed when their environment is deleted. `run_history` and `tool_versions` have **no** foreign key on `tool_id` so history and version snapshots are preserved after a tool is deleted (enabling Trash & Restore).

---

## Frontend Architecture

See [ux.md](ux.md) for the full component map, layout, and user flows.

### Tab System (`types/tabs.ts`)

```ts
type TabKind = 'tool' | 'new-tool' | 'history-detail' | 'trash-detail' | 'environment-edit'
type ActiveFunction = 'tools' | 'history' | 'trash' | 'export' | 'environments'

interface AppTab {
  id: string        // toolId for 'tool' tabs; unique string for others
  kind: TabKind
  title: string
  toolId?: string         // only for kind === 'tool'
  entryId?: string        // only for kind === 'history-detail'
  environmentId?: string  // only for kind === 'environment-edit'; undefined = new environment
}

interface SlotState {
  tabs: AppTab[]
  activeTabIndex: number
}

interface TabState {
  slots: [SlotState, SlotState]
  activeSlot: 0 | 1
  splitEnabled: boolean
}

type RightSidebarContent =
  | { kind: 'versions'; toolId: string; initialVersionId?: string }
  | null
```

### State Shape (app-level, managed in `App.tsx`)

```ts
// Data
tools: ToolSummary[]
activeEnvironment: EnvironmentSummary | null
trashCount: number

// Tool cache (replaces selectedTool state — each tab looks up its full Tool here)
toolCache: Record<string, Tool>

// Tab system
tabState: TabState
saveCount: number  // increments on each tool save; triggers version panel refresh

// Navigation history (managed by useNavHistory hook)
// stack: NavEntry[]  — {slotIndex, tabId} entries, capped at 100
// cursor: number     — current position in the stack
// canGoBack: boolean — cursor > 0
// canGoForward: boolean — cursor < stack.length - 1

// Right sidebar
rightSidebar: RightSidebarContent  // auto-set when active tab changes

// Output panel
outputPanelOpen: boolean
outputLines: string[]  // streamed via tool:output events
runResult: RunResult | null
runCount: number       // increments on each tool:done; triggers history refresh

// Layout
activeFunction: ActiveFunction
leftPanelOpen: boolean    // persists in localStorage
rightSidebarVisible: boolean
sidebarWidth: number      // persists in localStorage
rightSidebarWidth: number // persists in localStorage
outputPanelHeight: number // persists in localStorage
splitRatio: number        // persists in localStorage (% of main area for slot 0)
```

**Key behaviors:**
- `toolCache` is populated lazily when a tool tab is opened; all tool tabs read from this shared cache
- `rightSidebar` is set automatically by a `useEffect` watching `tabState`: tool tab → set versions for that toolId; history-detail tab → restore version from `historyVersionCache` ref if available; other tab → null
- `historyVersionCache` is a `useRef` (not state) so it doesn't cause re-renders; populated by `onHistoryVersionFound` callback called from `HistoryDetailPanel` when it loads an entry with a versionId
- Navigation history is managed by `useNavHistory` hook; records every active-tab change via a `useEffect` watching `tabState`; `skipNavPushRef` (a `useRef`) suppresses pushes during programmatic back/forward navigation

### Frontend Rules
- No state management library — `useState` / `useReducer` at `App.tsx` level only
- Components must not exceed ~150 lines — split if needed
- No `fetch` or `XMLHttpRequest` — all data comes from Wails bindings in `wailsjs/`
- All tab state, panel open/close state, and layout sizes live at the `App` level, passed as props
- All tabs are rendered simultaneously in the DOM with `key={tab.id}`; inactive tabs use `display:none` — this preserves React component state across tab switches and cross-slot drags

---

## Execution Flow

```
User edits param inputs inline in Tool Detail (pre-filled with defaults), clicks "Run"
      │
      ▼
Frontend calls RunTool({ toolId, paramValues })
      │
      ▼
app.go → loads Tool from store, calls GetActiveEnvVars(), passes both to executor
      │
      ▼
executor — variable resolution (strictly in order):
  1. Replace {{ENV_KEY}} in script body using active environment's key-value pairs
  2. Replace [[PARAM_NAME]] in script body with user-supplied param values
      │
      ▼
executor — platform guard check (e.g. powershell/cmd are Windows-only; bash is macOS/Linux-only)
      │       write resolved script to temp file, start subprocess
  (powershell.exe for type=powershell, cmd.exe for type=cmd, /bin/bash for type=bash,
   osascript for type=applescript, python3/python for type=python, `go run` for type=go)
      │
      ├── stream stdout+stderr chunks → emit tool:output events
      │
      ▼
executor — subprocess exits → emit tool:done event with RunResult
      │
      ├── app.go looks up latest version ID for the tool, records run to run_history
      │         (tool name snapshot, exit code, output, version_id)
      │
      ▼
Frontend: OutputPanel displays streamed output + exit code badge
          runCount increments → HistoryPanel reloads if open
          History entries link to the exact version that was run via version_id
```

**Note:** Param values entered in the Tool Detail view are one-time overrides and are never saved back to the tool definition. To change defaults, the user uses the Edit flow.

---

## Key Constraints

- Binary targets: Windows (`windows/amd64`), macOS (`darwin/amd64`, `darwin/arm64`), Linux (`linux/amd64`) — built via CI matrix
- Binary size: ~14MB in practice — `modernc.org/sqlite` (pure Go, no CGO) contributes ~8MB; this supersedes the original 10MB target which was set before SQLite was chosen
- No network calls anywhere in the codebase
- `wailsjs/` is auto-generated — never edit manually
- Each frontend feature maps to exactly one Go method on `App`
- All DB access goes through `internal/store`, never inline in `app.go`