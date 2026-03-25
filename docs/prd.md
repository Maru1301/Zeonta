# Product Requirements Document — Zeonta v1

Derived from [constitution.md](../constitution.md). This document breaks the v1 scope into concrete features, user stories, and acceptance criteria.

---

## Users

**Primary user:** A developer or technical user who frequently runs shell scripts (`.bat`, `.ps1`) or Go functions on Windows and wants a GUI to manage and execute them without opening a terminal.

---

## Features

### F1 — Tool Creation

**User story:**
As a user, I can create a new tool by giving it a name, writing a script or Go function body, and saving it — so that I can run it later from the UI.

**Acceptance criteria:**
- ✅ User can open a "New Tool" form from the main UI
- ✅ Form has fields for: tool name, tool type (shell script / Go function), and script/function body
- ✅ Tool name must be unique and non-empty; validation error shown if violated
- ✅ User can save the tool; it appears in the tool list immediately
- ✅ Saved tools persist across app restarts

---

### F2 — Parameter Definition

**User story:**
As a user, I can define named input parameters for a tool — so that I can pass different values each time I run it without editing the script body.

**Acceptance criteria:**
- ✅ Within the tool form, user can add one or more named parameters
- ✅ Each parameter has: a name and an optional default value
- ✅ Parameters are referenced inside the script body using `[[PARAM_NAME]]` syntax
- ✅ At run time, user is prompted to fill in parameter values before execution
- ✅ If a default value exists, it is pre-filled in the run prompt

---

### F3 — Environment Sets *(supersedes per-tool env vars)*

**User story:**
As a user, I can create named sets of environment variables (e.g. "Dev", "Prod") and pick one as active — so that all tools automatically run with the correct environment without me editing each tool individually.

**Acceptance criteria:**
- ✅ User can create, rename, and delete named environment sets
- ✅ Each environment set holds an arbitrary number of key-value pairs
- ✅ Exactly one environment set can be marked as active at a time (or none)
- ✅ When a tool runs, the active environment's key-value pairs are injected into the subprocess and resolved in the script body via `{{KEY}}` syntax
- ✅ Tools no longer have per-tool env var definitions or run-time env var editing
- ✅ Switching the active environment requires no changes to individual tools

---

### F4 — Tool Execution

**User story:**
As a user, I can select a tool and run it from the UI — so that I get the output without opening a terminal.

**Acceptance criteria:**
- ✅ Each tool in the list has a "Run" action
- ✅ If the tool has parameters, a prompt appears for the user to fill values before execution
- ✅ Execution output (stdout + stderr) is displayed inline in the UI
- ✅ If execution fails, the exit code and error output are shown clearly
- ✅ The UI remains responsive during execution (no freezing)

---

### F5 — Tool Modification

**User story:**
As a user, I can edit an existing tool's name, script body, parameters, and environment variables — so that I can keep my tools up to date without deleting and recreating them.

**Acceptance criteria:**
- ✅ Each tool has an "Edit" action that opens the tool form pre-filled with current values
- ✅ User can modify any field and save changes
- ✅ Changes persist across app restarts
- ✅ Renaming a tool to an existing name shows a validation error

---

### F6 — Tool Deletion

**User story:**
As a user, I can permanently delete a tool I no longer need — so that the tool list stays clean.

**Acceptance criteria:**
- ✅ Each tool has a "Delete" action
- ✅ A confirmation prompt is shown before deletion
- ✅ After deletion, the tool is removed from the list and cannot be recovered

---

### F7 — Go Snippet Mode

**User story:**
As a user, I can write just the body of a Go function as my tool — so that I don't have to write `package main`, imports, or a `func main()` wrapper every time.

**Acceptance criteria:**
- ✅ If the Go tool body does not begin with `package`, the executor treats it as a snippet and automatically wraps it in `package main` + `func main() { ... }`
- ✅ Users may optionally include an `import (...)` block at the top of their snippet; the executor injects it correctly into the wrapped file
- ✅ If the body already begins with `package`, it is executed as-is (full-file mode, backward compatible)
- ✅ Snippet mode and full-file mode are distinguished automatically — no extra toggle needed in the UI

---

## Non-Functional Requirements

| Requirement | Target |
|---|---|
| Binary size | ≤ 10MB |
| Platform | Windows only |
| Network | No network calls at any point |
| Startup time | App ready within 3 seconds on a modern machine |
| Script execution | Output begins streaming within 1 second of run |

---

## Out of Scope for v1

- Importing/exporting tools
- Categorizing or tagging tools
- Execution history / logs
- Scheduling tools to run automatically
- Any form of cloud sync or remote execution