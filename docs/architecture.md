# Architecture — Zeonta v1

Defines the system structure, layer boundaries, and data flow.
Read alongside [ux.md](ux.md) (UI structure) and [prd.md](prd.md) (feature requirements).

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
│  └─────────────────┘        │   └── store/          │ │
│                             │   └── executor/       │ │
│                             │                       │ │
│                             │   scripts/ (stored)   │ │
│                             └──────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Rule:** The frontend never accesses the filesystem or executes anything directly. All side effects go through Go via Wails bindings.

---

## Frontend Architecture

### Tech
- React (functional components + hooks)
- MUI for all interactive components (buttons, inputs, selects, panels)
- Tailwind for layout, spacing, and sizing
- No state management library — React `useState` / `useContext` is sufficient for v1

### State Shape (app-level)

```ts
type AppState = {
  tools: Tool[]               // all saved tools
  selectedToolId: string | null
  editPanelMode: 'hidden' | 'create' | 'edit' | 'run-params'
  outputPanel: {
    visible: boolean
    toolName: string
    output: string
    exitCode: number | null
    running: boolean
  }
}
```

### Component Tree
See [ux.md — Component Map](ux.md#component-map) for the full tree.

### Frontend Rules
- Components must not exceed ~150 lines — split if needed
- No direct `fetch` or `XMLHttpRequest` — all data comes from Wails bindings
- All Wails bindings are imported from `wailsjs/go/main/App`
- Panel open/close state lives at the `App` level and is passed as props

---

## Backend Architecture

### Packages

```
app.go              → All Go methods exposed to the frontend (Wails bindings)
internal/
  store/            → Reads and writes tool definitions to disk (JSON)
  executor/         → Runs shell scripts and Go snippets, captures output
scripts/            → Shell script files saved by the user, named by tool ID
```

### Data Model

```go
// Tool represents a user-defined runnable unit
type Tool struct {
    ID       string     `json:"id"`       // UUID
    Name     string     `json:"name"`
    Type     ToolType   `json:"type"`     // "shell" | "go"
    Body     string     `json:"body"`     // script or Go function body
    Params   []Param    `json:"params"`
    EnvVars  []EnvVar   `json:"envVars"`
}

type Param struct {
    Name    string `json:"name"`
    Default string `json:"default"`
}

type EnvVar struct {
    Key   string `json:"key"`
    Value string `json:"value"`
}

type ToolType string
const (
    ToolTypeShell ToolType = "shell"
    ToolTypeGo    ToolType = "go"
)
```

### Storage
- Tools are persisted as a single JSON file: `%APPDATA%\Zeonta\tools.json`
- `internal/store` handles all read/write; `app.go` never touches the filesystem directly

### Execution
- Shell tools: write body to a temp `.ps1` or `.bat` file, execute via `exec.Command`, capture stdout+stderr
- Go tools: v1 scope TBD — consider running as a subprocess via `go run` with a temp file
- Parameters are substituted into the script body before execution
- Env vars are injected into the command's environment

---

## Data Flow — Run a Tool

```
User clicks "Run"
      │
      ▼
Frontend: calls App.RunTool(toolID, paramValues)
      │
      ▼
app.go: looks up tool from store
      │
      ▼
executor: substitutes params, injects env vars, executes script
      │
      ├── streams stdout/stderr back via Wails events
      │
      ▼
Frontend: OutputPanel receives events, appends to output log
      │
      ▼
executor: returns exit code
      │
      ▼
Frontend: OutputPanel shows exit code badge
```

---

## Key Constraints (from constitution.md)

- Binary ≤ 10MB — avoid heavy Go dependencies
- No network calls anywhere in the codebase
- `wailsjs/` is auto-generated — never edit manually
- Each frontend feature maps to exactly one Go method on `App`
- All file I/O goes through `internal/store`, not inline in `app.go`