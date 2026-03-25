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

// EnvVar is a key-value pair injected into the tool's execution environment
type EnvVar struct {
    Key   string `json:"key"`
    Value string `json:"value"`
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
    EnvVars []EnvVar `json:"envVars"` // may be empty
}

// ToolSummary is the lightweight version used in the sidebar list
type ToolSummary struct {
    ID   string   `json:"id"`
    Name string   `json:"name"`
    Type ToolType `json:"type"`
}

// RunInput carries the values the user provided at run time.
// Both ParamValues and EnvVarValues are editable by the user before execution.
type RunInput struct {
    ToolID       string            `json:"toolId"`
    ParamValues  map[string]string `json:"paramValues"`  // key = Param.Name
    EnvVarValues map[string]string `json:"envVarValues"` // key = EnvVar.Key, overrides tool-definition defaults at run time
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

### Execution

#### `RunTool(input RunInput) (RunResult, error)`
Executes a tool synchronously.

**Resolution order (applied strictly in sequence):**

1. **Env var substitution (global)** — replace all `{{ENV_KEY}}` occurrences everywhere: in the script body and inside any param values. This means a param value of `"{{BASE_URL}}/users"` will have `{{BASE_URL}}` resolved before the param itself is used.
2. **Param substitution** — replace all `{{PARAM_NAME}}` occurrences in the script body with the (already env-var-resolved) values from `input.ParamValues`.
3. **Process injection** — inject all key-value pairs from `input.EnvVarValues` into the subprocess's OS environment, so scripts can also access them via native shell syntax (`$env:KEY` in PowerShell, `%KEY%` in cmd).

`input.EnvVarValues` contains the user's run-time values (pre-filled from the tool's stored `EnvVars` defaults, then optionally edited by the user before running).

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
  ListTools, GetTool, CreateTool, UpdateTool, DeleteTool, RunTool
} from "../wailsjs/go/main/App";
import { EventsOn } from "../wailsjs/runtime";

// List all tools for the sidebar
const summaries = await ListTools();

// Load full detail when a tool is selected
const tool = await GetTool(id);

// Create a new tool
const saved = await CreateTool({ name, type, body, params, envVars });

// Update an existing tool
const updated = await UpdateTool({ id, name, type, body, params, envVars });

// Delete a tool
await DeleteTool(id);

// Run a tool and stream output
// EnvVarValues is pre-filled from the tool's stored EnvVars defaults, then
// shown to the user in the Edit Panel for optional editing before execution.
EventsOn("tool:output", (chunk: string) => appendToOutputPanel(chunk));
EventsOn("tool:done",   (result)       => showExitCode(result.exitCode));
await RunTool({
  toolId: id,
  paramValues:  { PARAM_NAME: "value" },
  envVarValues: { BASE_URL: "https://example.com", API_KEY: "abc123" },
});
```

---

## Error Handling Convention

- All errors returned from Go are surfaced to the user as inline error messages in the relevant panel (Edit Panel or Output Panel).
- The frontend must never silently swallow errors.
- Error messages from Go should be human-readable (no raw Go error strings like `"open /path: no such file"`).