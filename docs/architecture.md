# Architecture — Zeonta v1

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
├── main.go                  # Wails entry point — initializes app and store
├── app.go                   # All Go methods exposed to the frontend via Wails
├── internal/
│   ├── store/
│   │   ├── store.go            # Open DB, run schema migration, expose Store struct
│   │   ├── tools.go            # CRUD: ListTools, GetTool, CreateTool, UpdateTool, DeleteTool
│   │   └── environments.go     # CRUD + SetActiveEnvironment, GetActiveEnvVars
│   └── executor/
│       └── executor.go      # Variable resolution, subprocess execution, output streaming
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Sidebar/
│       │   │   ├── Sidebar.tsx
│       │   │   ├── ToolList.tsx
│       │   │   └── ToolListItem.tsx
│       │   ├── ContentArea/
│       │   │   ├── ContentArea.tsx
│       │   │   ├── EmptyState.tsx
│       │   │   └── ToolDetail.tsx
│       │   ├── EditPanel/
│       │   │   ├── EditPanel.tsx
│       │   │   └── ParamEditor.tsx
│       │   ├── Environments/
│       │   │   └── EnvironmentPanel.tsx
│       │   ├── Exports/
│       │   │   └── ExportPanel.tsx
│       │   └── OutputPanel/
│       │       └── OutputPanel.tsx
│       ├── types/
│       │   └── tool.ts      # TypeScript types mirroring Go structs in api.md
│       └── App.tsx          # Root layout: Sidebar + ContentArea + EditPanel + OutputPanel
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
- Opens `%APPDATA%\Zeonta\zeonta.db` on startup, creating the file and directory if absent
- Runs schema migrations (`CREATE TABLE IF NOT EXISTS`) on every startup
- Never contains execution or business logic

### `internal/executor`
- Receives a fully-loaded `Tool` and a `RunInput` from `app.go`
- Performs variable resolution (see below)
- Writes the resolved script to a temp file, executes it, streams output via Wails events

---

## Database

**Driver:** `modernc.org/sqlite` (pure Go, no CGO, no C compiler required)

**Location:** `%APPDATA%\Zeonta\zeonta.db`

**Schema:**

```sql
CREATE TABLE IF NOT EXISTS tools (
    id         TEXT    PRIMARY KEY,
    name       TEXT    UNIQUE NOT NULL,
    type       TEXT    NOT NULL,        -- "shell" | "go"
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
```

`ON DELETE CASCADE` ensures params are removed when a tool is deleted, and env entries are removed when their environment is deleted.

---

## Frontend Architecture

See [ux.md](ux.md) for the full component map, layout, and user flows.

### State Shape (app-level, managed in `App.tsx`)

```ts
type AppState = {
  tools: ToolSummary[]                          // sidebar list
  selectedToolId: string | null
  selectedTool: Tool | null                     // full detail of selected tool
  editPanelMode: 'create' | 'edit' | null
  outputPanelOpen: boolean
  outputLines: string[]                         // streamed via tool:output events
  runResult: RunResult | null                   // set on tool:done event
  environmentPanelOpen: boolean
  activeEnvironment: EnvironmentSummary | null
  exportPanelOpen: boolean
}
```

### Frontend Rules
- No state management library — `useState` / `useReducer` at `App.tsx` level only
- Components must not exceed ~150 lines — split if needed
- No `fetch` or `XMLHttpRequest` — all data comes from Wails bindings in `wailsjs/`
- Panel open/close state lives at the `App` level, passed as props

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
executor — write resolved script to temp file, start subprocess
  (PowerShell for type=shell, `go run` for type=go)
      │
      ├── stream stdout+stderr chunks → emit tool:output events
      │
      ▼
executor — subprocess exits → emit tool:done event with RunResult
      │
      ▼
Frontend: OutputPanel displays streamed output + exit code badge
```

**Note:** Param values entered in the Tool Detail view are one-time overrides and are never saved back to the tool definition. To change defaults, the user uses the Edit flow.

---

## Key Constraints

- Binary target: Windows only, `wails build -platform windows/amd64 -ldflags "-s -w"`
- Binary size: ~14MB in practice — `modernc.org/sqlite` (pure Go, no CGO) contributes ~8MB; this supersedes the original 10MB target which was set before SQLite was chosen
- No network calls anywhere in the codebase
- `wailsjs/` is auto-generated — never edit manually
- Each frontend feature maps to exactly one Go method on `App`
- All DB access goes through `internal/store`, never inline in `app.go`