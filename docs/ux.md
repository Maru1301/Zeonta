# UX Design — Zeonta v1

Defines the screen layout, user flows, and visual style for the Zeonta frontend.
All implementation must follow this document. Code must not introduce layouts or flows not described here.

---

## Visual Style

Inspired by **Obsidian**: dark, minimal, content-first.

| Property | Value |
|---|---|
| Theme | Dark only (v1) |
| Background | Deep dark gray (`#1a1a1a`) |
| Surface (panels) | Slightly lighter (`#242424`) |
| Border | Subtle, low-contrast (`#3a3a3a`) |
| Accent | Muted purple / indigo |
| Text (primary) | Off-white (`#dcdcdc`) |
| Text (secondary) | Muted gray (`#888888`) |
| Font (UI) | System sans-serif |
| Font (code/script) | Monospace (e.g. JetBrains Mono, Fira Code, or system fallback) |

**Principles:**
- No unnecessary chrome — borders and backgrounds should recede, content should lead
- Generous padding inside panels
- Transitions should be smooth but fast (150–200ms)

---

## Screen Layout

```
+-------------------+----------------------------------------------+
|                   |                                              |
|   SIDEBAR         |   CONTENT AREA                               |
|   (240px fixed)   |   (fills remaining width)                   |
|                   |                                              |
|   [ + New Tool ]  |   [ Tool Detail View ]                       |
|                   |   or                                         |
|   > Tool A        |   [ Empty State ]                            |
|   > Tool B        |                                              |
|   > Tool C        |                                              |
|   ...             +----------------------------------------------+
|                   |                                              |
|   [ Trash (N) ]   |   OUTPUT PANEL                               |
|                   |   (hidden by default, slides up on run)      |
|                   |   (resizable, ~35% height when open)         |
+-------------------+----------------------------------------------+
                                            +------------------------+
                                            |   EDIT PANEL           |
                                            |   (slides in from      |
                                            |    right, ~420px wide) |
                                            |                        |
                                            |   [ Tool Form ]        |
                                            +------------------------+
```

### Panel Responsibilities

| Panel | Purpose |
|---|---|
| **Sidebar** | Lists all saved tools; buttons for new tool, import/export, history, environment, and trash |
| **Content Area** | Displays selected tool's detail: name, type, script preview, inline param inputs, Run button |
| **Edit Panel** | Slides in from right for create/edit only; overlays content area partially |
| **Output Panel** | Slides up from bottom when tool is run; shows stdout/stderr with exit code |
| **Versions Panel** | Slides in from right; shows all saved snapshots of a tool; supports running or restoring any version |
| **Trash Panel** | Slides in from right; shows deleted tools with multi-select restore and permanent-delete actions |

---

## User Flows

### Flow 1 — Create a Tool

```
[Sidebar: click "+ New Tool"]
        ↓
[Edit Panel slides in from right — blank form]
  Fields: Name, Type (shell/Go), Script Body, Parameters
        ↓
[User fills form, clicks "Save"]
        ↓
[Edit Panel closes]
[New tool appears in Sidebar, selected automatically]
[Content Area shows the new tool's detail]
```

### Flow 2 — Edit a Tool

```
[Content Area: click "Edit" on a selected tool]
        ↓
[Edit Panel slides in — form pre-filled with current values]
        ↓
[User modifies fields, clicks "Save"]
        ↓
[Edit Panel closes]
[Content Area refreshes with updated values]
```

### Flow 3 — Run a Tool

Parameter inputs (if any) are shown inline in the Tool Detail view, pre-filled with their stored defaults.
The user edits values directly and clicks "Run" — no separate panel is opened.

```
[Content Area: edit any parameter inputs (pre-filled with defaults)]
        ↓
[Click "Run"]
        ↓
[Output Panel slides up — execution begins immediately with the current input values]
        ↓
[stdout/stderr stream in as execution progresses]
        ↓
[Execution completes — exit code shown]
[Output remains visible until user dismisses or runs again]
```

> **Note:** Parameter values edited in the Tool Detail view are **not** saved back to the tool definition.
> They are one-time overrides for this execution. To change the defaults, use the Edit flow (Flow 2).

### Flow 4 — Export Tools

```
[Sidebar: click "Export"]
        ↓
[Export Panel replaces Content Area]
  All tools listed with checkboxes (all pre-selected)
  "Select All" / "Deselect All" toggle
  "Export (N)" button shows count of selected tools
        ↓
[User selects desired tools, clicks "Export (N)"]
        ↓
[Native save dialog opens]
  If cancelled → Export Panel stays open, user can retry
  If confirmed → JSON file written
        ↓
[Export Panel closes, snackbar confirms success]
```

### Flow 5 — Import Tools

```
[Sidebar: click "Import"]
        ↓
[Native multi-file picker opens — accepts .json, .ps1, .bat, .go]
  If cancelled → nothing happens
        ↓
[Each selected file is parsed and tools are created]
  .json → all tools inside the file
  .ps1 / .bat → one shell tool, name from filename
  .go → one Go tool, name from filename
  Conflicts (name already exists) → skipped
        ↓
[Snackbar shows result: "Imported N tools · Skipped: X, Y"]
[Sidebar tool list refreshes]
```

### Flow 6 — Delete a Tool

```
[Content Area: click "Delete"]
        ↓
[Inline confirmation appears: "Delete <name>? This cannot be undone." + Confirm / Cancel]
        ↓
[On Confirm: tool removed from Sidebar, Content Area shows Empty State]
```

### Flow 7 — View History

```
[Sidebar: click "History"]
        ↓
[History Panel slides in from right]
  Optional filter: "All tools" or select a specific tool
  List: exit code chip · tool name · timestamp (newest first)
        ↓
[Click a row]
        ↓
[Detail view: tool name, exit code, timestamp, full output block]
  Back button → returns to list
        ↓
[While History Panel is open, completing a new run refreshes the list automatically]
```

### Flow 8 — Clear History

```
[History Panel: click "Clear"]
        ↓
[Confirmation dialog: describes scope (filtered tool or all tools)]
  Cancel → nothing happens
  Clear  → entries deleted, list refreshes
```

### Flow 9 — View & Restore a Tool Version

```
[Content Area: click clock icon ("Versions") on a selected tool]
        ↓
[Version Panel slides in from right — list of snapshots, newest first]
  Each row: version number · save date
  Version matching live tool content is tagged "current"
        ↓
[Click a version row]
        ↓
[Detail view: save date, type chip, script preview]
  "Run this version" → executes old snapshot without modifying the live tool;
                       run is recorded to history with the version's ID
  "Restore to current" (non-current only) → live tool is updated to match snapshot;
                                            no new version recorded; panel returns to list
        ↓
[When a new save happens, Version Panel reloads automatically]
[When a different tool is selected, Version Panel closes]
```

### Flow 10 — Restore a Deleted Tool (Trash)

```
[Sidebar: click "Trash" button (shows count badge when deleted tools exist)]
        ↓
[Trash Panel slides in from right]
  Search bar + select-all checkbox
  Rows: checkbox · tool name · version count · last saved date
        ↓
Option A — Bulk restore / delete:
  [Check one or more rows]
  Header shows: "N of M selected" + "Restore (N)" and "Delete (N)" buttons
  "Restore (N)" → confirmation dialog → restores latest version of each tool;
                  Trash Panel stays open and reloads
  "Delete (N)"  → confirmation dialog → permanently deletes versions + run history;
                  Trash Panel stays open and reloads

Option B — Detail view:
  [Click a row (not checkbox)]
  Detail view: type chip, version preview, all versions list, script preview
  "Restore this version" button → confirmation dialog → restores that specific version;
                                  Trash Panel stays open and returns to list
        ↓
[Trash Panel auto-refreshes if a tool is deleted while the panel is open]
```

### Flow 11 — View Version from History

```
[History Panel: click a history entry]
        ↓
[Detail view: tool name, exit code, timestamp, full output]
  If the run has a versionId (recorded after versioning was added):
    "View version" button is shown
        ↓
[Click "View version"]
        ↓
[Version Panel opens pre-selected to the exact version used in that run]
```

---

## Component Map

```
App
├── Sidebar
│   ├── NewToolButton
│   ├── ImportButton
│   ├── ExportButton
│   ├── HistoryButton
│   ├── TrashButton (with count badge; badge hidden when trash is empty)
│   ├── ToolList
│   │   └── ToolListItem (one per tool)
│   └── EnvironmentIndicator (active env name or "No Environment")
├── ContentArea  [mutually exclusive with ExportPanel]
│   ├── EmptyState (shown when no tool selected)
│   └── ToolDetail
│       ├── ToolHeader (name, type badge, Edit + Delete + Versions + Run buttons)
│       ├── ScriptPreview (read-only code block)
│       └── ParamInputs (editable TextField per param, pre-filled with defaults)
├── ExportPanel  [replaces ContentArea when export flow is active]
│   ├── ToolCheckboxList (one row per tool)
│   └── SelectAll / Export(N) / Cancel buttons
├── EditPanel (conditionally rendered for create/edit only, slides in from right)
│   ├── ToolNameField
│   ├── ToolTypeSelector (shell / Go)
│   ├── ScriptEditor (multiline code input)
│   ├── ParamEditor (add/remove named params with defaults)
│   └── SaveButton / CancelButton
├── HistoryPanel (conditionally rendered, slides in from right)
│   ├── ToolFilter (dropdown: all tools or specific tool)
│   ├── ClearButton (opens confirmation dialog before clearing)
│   ├── HistoryList (clickable rows: exit code chip · tool name · timestamp)
│   └── HistoryDetail (full output block + "View version" button + back button)
├── VersionPanel (conditionally rendered, slides in from right; tied to a specific tool)
│   ├── VersionList (clickable rows: version number · save date · "current" chip)
│   └── VersionDetail (script preview, type chip, "Run this version" + "Restore to current" buttons)
├── TrashPanel (conditionally rendered, slides in from right)
│   ├── SearchBar
│   ├── SelectAllCheckbox (with indeterminate state; shows "N of M selected")
│   ├── TrashList (rows: checkbox · tool name · version count · last saved date)
│   │   └── TrashDetail (type chip, script preview, version list, "Restore this version" button)
│   └── BulkActions (Restore(N) + Delete(N) buttons; shown when items are checked)
└── OutputPanel (conditionally rendered, slides up from bottom)
    ├── OutputHeader (tool name, exit code badge, Close button)
    └── OutputBody (monospace scrollable log output)
```

---

## States

| State | What is shown |
|---|---|
| No tool selected | Sidebar + Empty State in Content Area |
| Tool selected | Sidebar + Tool Detail |
| Creating new tool | Sidebar + Tool Detail (or Empty) + Edit Panel (blank) |
| Editing tool | Sidebar + Tool Detail + Edit Panel (pre-filled) |
| Running | Sidebar + Tool Detail (with param inputs) + Output Panel open |
| Exporting | Sidebar + Export Panel (replaces Content Area) |
| Viewing history | Sidebar + Content Area + History Panel (slides in from right) |
| Clearing history | History Panel + confirmation dialog overlay |
| Confirm delete | Inline confirmation within Tool Detail |
| Viewing versions | Sidebar + Tool Detail + Version Panel (slides in from right) |
| Running old version | Sidebar + Tool Detail + Version Panel + Output Panel open |
| Restoring version | Version Panel (confirm dialog → live tool updated, panel returns to list) |
| Viewing trash | Sidebar + Content Area + Trash Panel (slides in from right) |
| Restoring from trash | Trash Panel + confirmation dialog overlay |
| Permanently deleting from trash | Trash Panel + confirmation dialog overlay |