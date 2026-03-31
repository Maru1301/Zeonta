# UX Design — Zeonta 0.6.0

Defines the screen layout, user flows, and visual style for the Zeonta frontend.
All implementation must follow this document. Code must not introduce layouts or flows not described here.

---

## Visual Style

Inspired by **Obsidian**: dark, minimal, content-first.

| Property | Value |
|---|---|
| Theme | Dark (default) and Light — user-toggleable; preference persists |
| Background | Deep dark gray (`#1a1a1a`) in dark mode |
| Surface (panels) | Slightly lighter (`#242424`) in dark mode |
| Border | Subtle, low-contrast (`#3a3a3a`) in dark mode |
| Accent | Muted purple / indigo |
| Text (primary) | Off-white (`#dcdcdc`) in dark mode |
| Text (secondary) | Muted gray (`#888888`) in dark mode |
| Font (UI) | System sans-serif |
| Font (code/script) | Monospace (e.g. JetBrains Mono, Fira Code, or system fallback) |

**Principles:**
- No unnecessary chrome — borders and backgrounds should recede, content should lead
- Generous padding inside panels
- Transitions should be smooth but fast (150–200ms)

---

## Screen Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  TITLE BAR  [Logo · ZEONTA] [←][→]  ←── drag region ──→  [◧][◫][◨] [─][□][×] │
├────┬──────────────┬──────────────────────────────────┬──────────────────┤
│    │              │ [Tab1][Tab2][+]   [⊟ Split]       │                  │
│ F  │   SIDE       ├──────────────────────────────────│   RIGHT          │
│ U  │   PANEL      │                                  │   SIDEBAR        │
│ N  │  (collaps-   │   MAIN AREA                      │   (versions      │
│ C  │   ible,      │   (TabSlot × 1 or 2)             │    panel)        │
│ T  │   resizable) │                                  │                  │
│ I  │              ├──────────────────────────────────│                  │
│ O  │              │ OUTPUT PANEL (resizable)          │                  │
│ N  │              │ (hidden by default)               │                  │
│ B  │              │                                  │                  │
│ A  │              │                                  │                  │
│ R  │              │                                  │                  │
└────┴──────────────┴──────────────────────────────────┴──────────────────┘
```

### Zone Responsibilities

| Zone | Purpose |
|---|---|
| **Title Bar** | Custom frameless title bar: logo + app name (left), Back/Forward nav buttons (left of drag region), window drag region (center), panel toggle buttons + window controls (right) |
| **Function Bar** | 48px icon rail on the far left; one button per function (Tools, History, Trash, Export, Environments); theme toggle at bottom; clicking a button opens the Side Panel to that function's content, or toggles it closed if already open |
| **Side Panel** | Collapsible, resizable (default 240px); renders the selected function's content — tool list with New/Import actions, history list, trash list, export panel, or environment panel; width persists across sessions |
| **Main Area** | Tab-based content area; supports split into two side-by-side slots; each slot has its own tab bar; splitting is toggled by a button in the active slot's tab bar |
| **Right Sidebar** | Version Panel only; auto-opens when a tool tab is active; auto-updates when switching tool tabs; closes when a non-tool tab is active; width persists; can be toggled via title bar |
| **Output Panel** | Slides up from bottom when a tool is run; shows stdout/stderr with exit code; height persists; can be toggled via title bar |

### Title Bar Navigation Buttons

Two icon buttons placed left of the drag region (after the logo):

| Icon | Action | Shortcut |
|---|---|---|
| Arrow-back | Go Back — navigate to the previously active tab | Alt+Left |
| Arrow-forward | Go Forward — navigate forward after going back | Alt+Right |

Buttons are disabled (grayed out) when there is no history to navigate in that direction. Navigating back then opening a new tab clears the forward stack. If a target tab was closed, that entry is silently skipped. Navigation works across both split slots but does not re-enable split if it was toggled off.

### Title Bar Panel Toggle Buttons

Three icon buttons in the top-right of the title bar (left of window controls):

| Icon | Toggles |
|---|---|
| Border-left | Side Panel open/closed |
| Border-bottom | Output Panel open/closed |
| Border-right | Right Sidebar visible/hidden |

Active panels are indicated by a highlighted button state.

### Split Main Area

- Slot 0 always exists; Slot 1 appears when split is enabled
- Split is toggled by a button in the Slot 0 tab bar (only shown when at least one tab is open)
- New tabs from the Side Panel open into the currently active slot
- Closing all tabs in Slot 1 collapses the split automatically
- The active slot is highlighted with a colored outline

---

## User Flows

### Flow 1 — Create a Tool

```
[Function Bar: click Tools icon (if not already active)]
        ↓
[Side Panel shows tool list with "+ New Tool" button at top]
        ↓
[Click "+ New Tool"]
        ↓
[A "New Tool" tab opens in the active main area slot]
  Form: Name, Type (shell/Go), Description, Script Body, Parameters
        ↓
[User fills form, clicks "Save"]
        ↓
["New Tool" tab closes; new tool tab opens automatically]
[Side Panel tool list refreshes]
```

### Flow 2 — Edit a Tool

```
[Main Area: tool tab is active, showing Tool Detail]
        ↓
[Click "Edit" (pencil icon) in the tool detail header]
        ↓
[Tool Detail switches to edit mode inline]
  Fields pre-filled with current values
        ↓
[User modifies fields, clicks "Save"]
        ↓
[View mode restored with updated values]
[Right Sidebar version panel refreshes]
```

### Flow 3 — Run a Tool

Parameter inputs (if any) are shown inline in the Tool Detail view, pre-filled with their stored defaults.
The user edits values directly and clicks "Run" — no separate panel is opened.

```
[Main Area: tool tab is active]
[Edit any parameter inputs inline (pre-filled with defaults)]
        ↓
[Click "Run"]
        ↓
[Output Panel opens — execution begins immediately]
        ↓
[stdout/stderr streams into Output Panel]
        ↓
[Execution completes — exit code shown]
[Output remains visible until user closes or runs again]
```

> **Note:** Parameter values edited in the Tool Detail view are **not** saved back to the tool definition.
> They are one-time overrides. To change defaults, use the Edit flow (Flow 2).

### Flow 4 — Export Tools

```
[Function Bar: click Export icon]
        ↓
[Side Panel shows Export Panel]
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
[Snackbar confirms success]
```

### Flow 5 — Import Tools

```
[Side Panel (Tools function): click "Import"]
        ↓
[Native multi-file picker opens — accepts .json, .ps1, .bat, .go]
  If cancelled → nothing happens
        ↓
[Each selected file is parsed and tools are created]
  Conflicts (name already exists) → skipped
        ↓
[Snackbar shows result: "Imported N tools · Skipped: X, Y"]
[Side Panel tool list refreshes]
```

### Flow 6 — Delete a Tool

```
[Main Area: tool tab is active, click "Delete" (trash icon) in header]
        ↓
[Confirmation dialog: "Delete '<name>'? It will be moved to Trash."]
        ↓
[On Confirm: tool tab closes; tool removed from Side Panel list]
[Trash badge count increments in Function Bar]
```

### Flow 7 — View History

```
[Function Bar: click History icon]
        ↓
[Side Panel shows history list]
  Filter: "All tools" or select a specific tool
  List: exit code chip · tool name · timestamp (newest first)
        ↓
[Click a row]
        ↓
[A history-detail tab opens in the active main area slot]
  Shows: tool name, exit code chip, timestamp, full output block
  If the entry has a versionId: Right Sidebar auto-shows that exact version
        ↓
[While History function is active, completing a new run refreshes the list]
```

### Flow 8 — Clear History

```
[Side Panel (History function): click "Clear"]
        ↓
[Confirmation dialog: describes scope (filtered tool or all tools)]
  Cancel → nothing happens
  Clear  → entries deleted, list refreshes
```

### Flow 9 — View & Restore a Tool Version

```
[Main Area: click any tool tab]
        ↓
[Right Sidebar auto-opens (if visible) showing the Version Panel for that tool]
  List of snapshots, newest first
  Version matching live tool content tagged "current"
        ↓
[Click a version row]
        ↓
[Detail view: save date, type chip, script preview]
  "Run this version" → executes old snapshot without modifying the live tool;
                       run is recorded to history with the version's ID
  "Restore to current" (non-current only) → live tool updated to match snapshot;
                                            no new version recorded; panel returns to list
        ↓
[When a new save happens, Version Panel reloads automatically]
[When the active tab switches away from a tool tab, Version Panel content clears]
```

### Flow 10 — Restore a Deleted Tool (Trash)

```
[Function Bar: click Trash icon (shows count badge when deleted tools exist)]
        ↓
[Side Panel shows Trash Panel]
  Search bar + select-all checkbox
  Rows: checkbox · tool name · version count · last saved date
        ↓
Option A — Bulk restore / delete:
  [Check one or more rows]
  "Restore (N)" → confirmation dialog → restores latest version of each tool
  "Delete (N)"  → confirmation dialog → permanently deletes versions + run history

Option B — Detail view:
  [Click a row (not checkbox)]
  A trash-detail tab opens in the active main area slot
  Shows: type chip, script preview, version list
  "Restore this version" → confirmation dialog → restores that specific version;
                           tab closes automatically on success
        ↓
[Trash panel auto-refreshes if a tool is deleted while the panel is open]
```

### Flow 11 — View Version from History

```
[History-detail tab is active]
        ↓
[If the run has a versionId: Right Sidebar automatically shows that version]
  Pre-selected in the Version Panel without any extra click
        ↓
[Switching to a different history-detail tab: Right Sidebar updates to that entry's version (if any)]
[Switching back to the same history-detail tab: version is restored from cache]
```

### Flow 13 — Tab Navigation History

```
[User switches between tabs (any method: sidebar click, tab bar click, etc.)]
        ↓
[Each activation is recorded in a navigation history stack]
        ↓
[Back button (or Alt+Left) becomes enabled once there is a prior entry]

[Click Back / press Alt+Left]
        ↓
[App navigates to the previously active tab (in whichever slot it lives)]
  If that tab was closed → silently skip to the next live entry
        ↓
[Forward button (or Alt+Right) becomes enabled]

[Click Forward / press Alt+Right]
        ↓
[App navigates to the next entry in history]
        ↓
[Opening any new tab after going back clears the forward stack]
```

### Flow 12 — Manage Environments

```
[Function Bar: click Environments icon]
        ↓
[Side Panel shows Environment Panel]
  Lists all environment sets; active one is highlighted
  "+ New Environment" button
        ↓
[Click "+ New Environment" or click an existing environment's edit button]
        ↓
[An environment-edit tab opens in the active main area slot]
  Fields: environment name, key-value pairs
        ↓
[User fills form, clicks "Save"]
        ↓
[Tab closes; Side Panel environment list refreshes]
```

---

## Component Map

```
App
├── TitleBar
│   ├── Logo + "ZEONTA" (no-drag zone)
│   ├── Back / Forward nav buttons (no-drag zone; disabled when no history in that direction)
│   ├── Drag region (window drag, double-click to maximize)
│   └── Panel toggles (SidePanel, OutputPanel, RightSidebar) + Window controls
├── FunctionBar (48px icon rail)
│   ├── Tools button (BuildIcon)
│   ├── History button (HistoryIcon)
│   ├── Trash button (DeleteIcon, with count badge)
│   ├── Export button (UploadIcon)
│   ├── Environments button (TuneIcon)
│   └── Theme toggle (bottom)
├── SidePanel (collapsible, resizable)
│   ├── [Tools] New Tool button + Import button + ToolList
│   │   └── ToolListItem (one per tool)
│   ├── [History] HistoryPanel (list + filter + clear)
│   ├── [Trash] TrashPanel (list + search + bulk actions)
│   ├── [Export] ExportPanel (checkbox list + Export(N) button)
│   └── [Environments] EnvironmentPanel (list + activate + new/edit/delete)
├── MainArea
│   ├── TabBar (Slot 0) — shown only when Slot 0 has tabs
│   │   └── Tab (label + close button, per tab) + Split toggle button
│   ├── [if split] ResizeHandle (horizontal, between slots)
│   ├── [if split] TabBar (Slot 1) — shown only when Slot 1 has tabs
│   ├── Content overlay (all tabs rendered simultaneously; inactive tabs hidden via display:none)
│   │   ├── [kind=tool] ContentArea → ToolDetail (inline view + edit mode)
│   │   │   └── ParamEditor (in edit mode)
│   │   ├── [kind=new-tool] CreatePanel (blank tool form)
│   │   ├── [kind=history-detail] HistoryDetailPanel (output block)
│   │   ├── [kind=trash-detail] TrashDetailPanel (version list + restore)
│   │   └── [kind=environment-edit] EnvironmentEditPanel (key-value form)
│   └── EmptyState (shown per slot when slot has no tabs)
├── RightSidebar (auto-syncs with active tool or history-detail tab; resizable)
│   └── VersionPanel (version list + version detail + run/restore actions)
└── OutputPanel (slides up from bottom; resizable)
    ├── OutputHeader (tool name, exit code badge, Close button)
    └── OutputBody (monospace scrollable log output)
```

---

## States

| State | What is shown |
|---|---|
| No tabs open | Function Bar + Side Panel (if open) + EmptyState in main slot |
| Tool tab active | Tool Detail in main area; Version Panel auto-shown in Right Sidebar |
| Creating new tool | "New Tool" tab in main area with blank CreatePanel form |
| Editing tool | Tool Detail in edit mode (inline in main area) |
| Running | Tool Detail + Output Panel open at bottom |
| History function active | Side Panel shows history list |
| History-detail tab active | HistoryDetailPanel in main area; Right Sidebar shows linked version (if any) |
| Trash function active | Side Panel shows trash list |
| Trash-detail tab active | TrashDetailPanel in main area |
| Export function active | Side Panel shows ExportPanel |
| Environments function active | Side Panel shows EnvironmentPanel |
| Environment-edit tab active | EnvironmentEditPanel in main area |
| Split enabled | Two tab slots side by side; active slot highlighted |
| Right Sidebar hidden | Toggle button in title bar re-shows it; content resumes from last state |
| Side Panel collapsed | Function Bar still visible; panel width is zero |
```
