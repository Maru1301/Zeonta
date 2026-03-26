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
|                   |   OUTPUT PANEL                               |
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
| **Sidebar** | Lists all saved tools; button to create new tool |
| **Content Area** | Displays selected tool's detail: name, type, script preview, inline param inputs, Run button |
| **Edit Panel** | Slides in from right for create/edit only; overlays content area partially |
| **Output Panel** | Slides up from bottom when tool is run; shows stdout/stderr with exit code |

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

---

## Component Map

```
App
├── Sidebar
│   ├── NewToolButton
│   ├── ImportButton
│   ├── ExportButton
│   └── ToolList
│       └── ToolListItem (one per tool)
├── ContentArea  [mutually exclusive with ExportPanel]
│   ├── EmptyState (shown when no tool selected)
│   └── ToolDetail
│       ├── ToolHeader (name, type badge, Edit + Delete + Run buttons)
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
| Confirm delete | Inline confirmation within Tool Detail |