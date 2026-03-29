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
- ✅ If the tool has parameters, editable input fields are shown inline in the Tool Detail view, pre-filled with defaults
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
- ✅ After deletion, the tool disappears from the sidebar; its version history and run history are preserved in the trash
- ✅ Deleted tools can be recovered from the Trash panel

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

### F8 — Import / Export

**User story:**
As a user, I can export my tools to a file and import tools from a file — so that I can share tool definitions across machines or back them up.

**Acceptance criteria:**
- ✅ Clicking "Export" opens a selection view in the main panel listing all tools with checkboxes (all pre-selected)
- ✅ User can select any subset of tools and click "Export (N)" to open a native save dialog
- ✅ The exported file is a JSON envelope containing the selected tools' name, type, body, desc, and params (no IDs or timestamps)
- ✅ If the user cancels the save dialog the panel stays open; it closes only after a file is actually written
- ✅ Clicking "Import" opens a native multi-file picker supporting `.json`, `.ps1`, `.bat`, and `.go`
- ✅ Imported `.ps1` / `.bat` files create a shell tool; `.go` files create a Go tool — name derived from filename, desc and params empty
- ✅ Tools whose names already exist are skipped (not overwritten); the result message lists skipped names
- ✅ A snackbar confirms success or reports failure for both operations

---

### F9 — Execution History / Logs

**User story:**
As a user, I can review the history of past tool runs — so that I can check what output a tool produced and whether it succeeded or failed.

**Acceptance criteria:**
- ✅ Every tool run is automatically saved to history with: tool name snapshot, timestamp, exit code, and full output
- ✅ History is accessible from a "History" button in the sidebar
- ✅ History panel shows a filterable list (all tools or a specific tool), newest runs first
- ✅ Clicking a history entry shows the full output in a detail view
- ✅ History entries are preserved even if the tool is later renamed or deleted (name is snapshotted at run time)
- ✅ User can clear history for a specific tool or all tools; a confirmation dialog is shown before clearing
- ✅ If the history panel is open when a new run completes, the list refreshes automatically

---

### F10 — Tool Versioning

**User story:**
As a user, I can view the full history of changes to a tool and restore any previous version — so that I can recover from mistakes and understand how a tool has evolved.

**Acceptance criteria:**
- ✅ Every save (create or update) automatically records a full snapshot of the tool (body, name, type, desc, params)
- ✅ The Version Panel is shown in the right sidebar; it opens automatically when a tool tab becomes active and closes when a non-tool tab is active
- ✅ The Version Panel lists all snapshots newest-first; the version matching the live tool's current content is tagged "current"
- ✅ Clicking a version shows its script body, save date, and type
- ✅ Any version can be run directly ("Run this version") without modifying the live tool
- ✅ Any non-current version can be restored ("Restore to current"), updating the live tool without recording a new snapshot
- ✅ The Version Panel refreshes automatically when a new version is saved
- ✅ Each history entry links to the exact version that was run; opening a history-detail tab automatically pre-selects that version in the right sidebar

---

### F11 — Trash & Restore

**User story:**
As a user, I can recover tools I have deleted — so that accidental deletion does not result in permanent data loss.

**Acceptance criteria:**
- ✅ Deleted tools appear in the Trash panel, accessible from a Sidebar button with a count badge
- ✅ The Trash panel shows all deleted tools with checkboxes for multi-selection
- ✅ A select-all checkbox selects or deselects all visible items
- ✅ Selected tools can be restored (latest version) or permanently deleted in bulk
- ✅ Clicking a tool row opens a detail view showing its version history and script preview; a specific version can be selected and restored
- ✅ All restore operations require a confirmation dialog before proceeding
- ✅ The Trash panel stays open after restore and delete operations; the list reloads in place
- ✅ The Trash panel refreshes automatically when a tool is deleted while the panel is open

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

- Categorizing or tagging tools
- Scheduling tools to run automatically
- Any form of cloud sync or remote execution