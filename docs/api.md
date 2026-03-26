# API Contract — Zeonta v1

Defines all Go methods exposed to the frontend via Wails bindings, their input/output types, and the events emitted during execution.

The frontend **must** only call methods listed here. `app.go` **must** implement all methods listed here with exactly these signatures.

---

## Data Types

```go
// ToolType identifies what runtime executes the tool body
type ToolType string

const (
    ToolTypeShell ToolType = "shell" // executed via PowerShell or cmd
    ToolTypeGo    ToolType = "go"    // executed via go run
)

// Param is a named input that the user fills before running a tool
type Param struct {
    Name    string `json:"name"`
    Default string `json:"default"` // empty string if no default
}

// Tool is the complete definition of a user-created runnable unit
type Tool struct {
    ID      string   `json:"id"`      // UUID, assigned on creation
    Name    string   `json:"name"`    // user-defined, must be unique
    Type    ToolType `json:"type"`
    Body    string   `json:"body"`    // raw script or Go function body.
                                      // For Go tools: if the body does not begin with "package",
                                      // it is treated as a snippet and automatically wrapped:
                                      //   - Optional import block at the top is preserved.
                                      //   - Top-level declarations (func, type, var, const) are
                                      //     placed outside func main().
                                      //   - Remaining statements go inside func main().
                                      //   - If the snippet already defines func main(), no extra
                                      //     func main() is added.
                                      // Snippet mode supports stdlib only — no go.mod is created.
                                      // For third-party packages, start the body with "package main"
                                      // to use full-file mode.
    Params  []Param  `json:"params"`  // may be empty
}

// ToolSummary is the lightweight version used in the sidebar list
type ToolSummary struct {
    ID   string   `json:"id"`
    Name string   `json:"name"`
    Type ToolType `json:"type"`
    Desc string   `json:"desc"`
}

// ImportSummary reports the outcome of an ImportTools call.
type ImportSummary struct {
    Imported int      `json:"imported"` // number of tools successfully created
    Skipped  []string `json:"skipped"`  // names skipped due to conflicts or parse errors
}

// EnvEntry is a single key-value pair within an environment set.
type EnvEntry struct {
    ID        string `json:"id"`
    Key       string `json:"key"`
    Value     string `json:"value"`
    SortOrder int    `json:"sortOrder"`
}

// Environment is a named set of key-value pairs activated globally.
// Exactly one environment may be active at a time; all tools run against it.
type Environment struct {
    ID       string     `json:"id"`
    Name     string     `json:"name"`     // user-defined, must be unique
    IsActive bool       `json:"isActive"`
    Entries  []EnvEntry `json:"entries"`  // may be empty
}

// EnvironmentSummary is the lightweight version used in the sidebar.
type EnvironmentSummary struct {
    ID       string `json:"id"`
    Name     string `json:"name"`
    IsActive bool   `json:"isActive"`
}

// RunInput carries the values the user provided at run time.
type RunInput struct {
    ToolID      string            `json:"toolId"`
    ParamValues map[string]string `json:"paramValues"` // key = Param.Name
    // Env vars are sourced automatically from the active environment set — not provided by the caller.
}

// RunResult is returned after execution completes
type RunResult struct {
    Output   string `json:"output"`   // combined stdout + stderr
    ExitCode int    `json:"exitCode"` // 0 = success
    Error    string `json:"error"`    // non-empty if execution failed to start
}
```

---

## Methods

### Tool Management

#### `ListTools() []ToolSummary`
Returns all saved tools as summaries, ordered by creation time (oldest first).

- Returns an empty slice (not null) if no tools exist.
- Never returns an error — if the store is unreadable, returns empty slice and logs internally.

---

#### `GetTool(id string) (Tool, error)`
Returns the full definition of a single tool.

- Returns an error if the ID does not exist.

---

#### `CreateTool(tool Tool) (Tool, error)`
Saves a new tool. Assigns a new UUID to `tool.ID` (ignores any ID provided by the caller).

- Returns an error if `tool.Name` is empty or already taken.
- Returns the saved tool (with assigned ID) on success.

---

#### `UpdateTool(tool Tool) (Tool, error)`
Overwrites an existing tool by ID.

- Returns an error if the ID does not exist.
- Returns an error if the new `tool.Name` conflicts with a different tool's name.
- Returns the updated tool on success.

---

#### `DeleteTool(id string) error`
Permanently deletes a tool by ID.

- Returns an error if the ID does not exist.

---

### Environment Management

#### `ListEnvironments() []EnvironmentSummary`
Returns all environment sets ordered by creation time. Never returns null.

---

#### `GetEnvironment(id string) (Environment, error)`
Returns the full definition of a single environment set including all entries.

---

#### `CreateEnvironment(env Environment) (Environment, error)`
Saves a new environment set. Assigns a UUID to `env.ID`.
- Returns an error if `env.Name` is empty or already taken.

---

#### `UpdateEnvironment(env Environment) (Environment, error)`
Overwrites an existing environment set by ID. Replaces all entries.
- Returns an error if the ID does not exist or the new name conflicts.

---

#### `DeleteEnvironment(id string) error`
Permanently deletes an environment set and all its entries.

---

#### `SetActiveEnvironment(id string) error`
Marks the given environment as active and deactivates all others.
Pass an empty string `""` to deactivate all environments (no active environment).

---

### Import / Export

#### `ExportTools(ids []string) (bool, error)`
Opens a native save dialog and writes the selected tools to a JSON file.

- `ids` is the list of tool IDs to include. The caller provides this after the user selects tools in the Export Panel.
- Returns `true` if the file was written, `false` if the user cancelled the save dialog.
- Returns an error if the dialog fails or the file cannot be written.

**Export file format:**
```json
{
  "version": "0.1.0",
  "tools": [
    { "name": "...", "type": "shell|go", "body": "...", "desc": "...", "params": [...] }
  ]
}
```
IDs and timestamps are excluded — they are regenerated on import.

---

#### `ImportTools() (ImportSummary, error)`
Opens a native multi-file picker and imports tools from the selected files.

Supported file types:

| Extension | Behaviour |
|---|---|
| `.json` | Parsed as a Zeonta export file; imports all tools inside |
| `.ps1`, `.bat` | Creates one shell tool; name derived from filename; body = file contents |
| `.go` | Creates one Go tool; name derived from filename; body = file contents |

- Tools whose names already exist are skipped; their names are added to `Skipped`.
- Files that cannot be read or parsed are skipped; the filename is added to `Skipped`.
- Returns an empty `ImportSummary` (not an error) if the user cancels.

---

### Execution

#### `RunTool(input RunInput) (RunResult, error)`
Executes a tool synchronously.

**Template syntax:**

| Syntax | Resolved from | Example |
|---|---|---|
| `{{KEY}}` | Active environment set | `{{BASE_URL}}` |
| `[[PARAM]]` | User-provided parameter value | `[[GREETING]]` |

**Resolution order (applied strictly in sequence):**

1. **Env var substitution** — replace all `{{KEY}}` occurrences in the script body and inside param default values, using the active environment's entries.
2. **Param substitution** — replace all `[[PARAM]]` occurrences in the script body with the (already env-var-resolved) values from `input.ParamValues`.
3. **Process injection** — inject all active environment entries into the subprocess's OS environment, accessible via native shell syntax (`$env:KEY` in PowerShell).

**Output & result:**
- Captures stdout and stderr combined into `RunResult.Output`.
- Returns `RunResult` with the exit code on completion.
- Returns a Go-level error only if execution could not start (e.g. tool not found, bad script path). A non-zero exit code from the script is **not** a Go error — it is reflected in `RunResult.ExitCode`.

---

## Wails Events

Emitted by the backend during execution. The frontend listens with `EventsOn`.

| Event name | Payload type | When emitted |
|---|---|---|
| `tool:output` | `string` | Each chunk of stdout/stderr output during execution |
| `tool:done` | `RunResult` | When execution completes (success or failure) |

> **Note for v1:** `RunTool` returns the full result synchronously. Events are emitted in addition for real-time streaming to the Output Panel. The frontend can use either or both.

---

## Frontend Usage Example

```ts
import {
  ListTools, GetTool, CreateTool, UpdateTool, DeleteTool, RunTool,
  ExportTools, ImportTools,
} from "../wailsjs/go/main/App";
import { EventsOn } from "../wailsjs/runtime";

// List all tools for the sidebar
const summaries = await ListTools();

// Load full detail when a tool is selected
const tool = await GetTool(id);

// Create a new tool
const saved = await CreateTool({ name, type, body, desc, params });

// Update an existing tool
const updated = await UpdateTool({ id, name, type, body, desc, params });

// Delete a tool
await DeleteTool(id);

// Run a tool and stream output
// Env vars are sourced automatically from the active environment — not passed by the caller.
EventsOn("tool:output", (chunk: string) => appendToOutputPanel(chunk));
EventsOn("tool:done",   (result)       => showExitCode(result.exitCode));
await RunTool({ toolId: id, paramValues: { PARAM_NAME: "value" } });

// Export selected tools (returns false if user cancelled the save dialog)
const didExport = await ExportTools(["id1", "id2"]);

// Import from one or more files (returns empty summary if cancelled)
const { imported, skipped } = await ImportTools();
```

---

## Error Handling Convention

- All errors returned from Go are surfaced to the user as inline error messages in the relevant panel (Edit Panel or Output Panel).
- The frontend must never silently swallow errors.
- Error messages from Go should be human-readable (no raw Go error strings like `"open /path: no such file"`).