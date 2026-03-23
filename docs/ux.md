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
| **Content Area** | Displays selected tool's detail: name, type, script preview, params, env vars, Run button |
| **Edit Panel** | Slides in from right for create/edit; overlays content area partially |
| **Output Panel** | Slides up from bottom when tool is run; shows stdout/stderr with exit code |

---

## User Flows

### Flow 1 — Create a Tool

```
[Sidebar: click "+ New Tool"]
        ↓
[Edit Panel slides in from right — blank form]
  Fields: Name, Type (shell/Go), Script Body, Parameters, Env Vars
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

### Flow 3 — Run a Tool (no parameters, no env vars)

```
[Content Area: click "Run"]
        ↓
[Output Panel slides up — shows "Running..."]
        ↓
[stdout/stderr stream in as execution progresses]
        ↓
[Execution completes — exit code shown]
[Output remains visible until user dismisses or runs again]
```

### Flow 4 — Run a Tool (has parameters and/or env vars)

The Edit Panel opens as a "Run Panel" — same panel used for editing,
but in run mode. It shows two sections: Parameters and Environment Variables.
Both are pre-filled with their stored default values. The user reviews,
edits any values (Postman-style), then confirms.

```
[Content Area: click "Run"]
        ↓
[Edit Panel slides in — "Run: <tool name>" title]
  Section 1 — Parameters (if any):
    Each param shown as a labeled input, pre-filled with its default value
  Section 2 — Environment Variables (if any):
    Each env var shown as a key + editable value row, pre-filled with stored value
    Values support {{VAR}} references to other env vars (resolved top-to-bottom)
        ↓
[User reviews / edits values, clicks "Run Now"]
        ↓
[Edit Panel closes]
[Output Panel slides up — execution begins with the user-provided values]
        ↓
[stdout/stderr stream in, exit code shown on completion]
```

> **Note:** Edits made in the Run Panel are **not** saved back to the tool definition.
> They are one-time overrides for this execution only. To change the defaults,
> the user must use the Edit flow (Flow 2).

### Flow 5 — Delete a Tool

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
│   └── ToolList
│       └── ToolListItem (one per tool)
├── ContentArea
│   ├── EmptyState (shown when no tool selected)
│   └── ToolDetail
│       ├── ToolHeader (name, type badge, Edit + Delete buttons)
│       ├── ScriptPreview (read-only code block)
│       ├── ParamList (read-only list of defined params)
│       ├── EnvVarList (read-only list of env vars)
│       └── RunButton
├── EditPanel (conditionally rendered, slides in from right)
│   ├── ToolNameField
│   ├── ToolTypeSelector (shell / Go)
│   ├── ScriptEditor (multiline code input)
│   ├── ParamEditor (add/remove named params with defaults)
│   ├── EnvVarEditor (add/remove key-value pairs)
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
| Running (no params) | Sidebar + Tool Detail + Output Panel open |
| Running (with params/env vars) | Sidebar + Tool Detail + Edit Panel in run mode (params + env vars pre-filled) → then Output Panel open |
| Confirm delete | Inline confirmation within Tool Detail |