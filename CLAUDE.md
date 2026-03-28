# CLAUDE.md — Zeonta

This file is automatically loaded by Claude Code on every session. It defines the project specification, architecture constraints, and development workflow for building Zeonta.

---

## Project Specification (SDD)

**Zeonta** is a cross-platform desktop application that wraps shell scripts and Go utility functions in a clean, modern GUI. The goal is to eliminate the need for users to interact with the command line for common technical tasks.

### Core Requirements
- Users can trigger scripts/functions via UI with a single interaction
- Each tool is represented as a discrete, self-contained unit in the UI
- Results and output are displayed inline after execution
- The app runs as a single lightweight binary

### Out of Scope (v1)
- Remote script execution or cloud integration
- User authentication or multi-user support
- Plugin marketplace or external script downloading

---

## Architecture

```
main.go        → Wails app entry point
app.go         → Backend: all Go methods exposed to the frontend
frontend/src/  → React UI: components, pages, state
wailsjs/       → Auto-generated bindings (do not edit manually)
scripts/       → Bundled shell scripts called by app.go
```

### Key Constraints
- All backend logic lives in Go (`app.go` or packages under `internal/`)
- The frontend only calls Go via Wails bindings — no direct shell access from JS
- Each tool exposed to the frontend must have a single corresponding Go method
- Do not add state management libraries (e.g., Redux) unless complexity clearly demands it

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Go 1.21+ |
| Frontend | React.js |
| UI Components | MUI (Material UI) |
| Utility Styling | Tailwind CSS |
| Desktop Framework | Wails v2 |

---

## Dev Workflow

### Common Commands
```bash
# Start dev server (hot reload)
wails dev

# Build production binary
wails build

# Install frontend dependencies
cd frontend && npm install

# Generate Wails bindings (auto-runs on wails dev/build)
wails generate module
```

### Adding a New Tool
1. Add a Go method to `app.go`
2. Run `wails dev` to auto-generate the JS binding
3. Import and call the binding from the relevant React component
4. Register the tool in the UI tool registry

### Versioning Policy
The app version lives in `wails.json` (`"version"` field). Follow semantic versioning:
- **Patch** (`0.x.Y`): bug fixes only, no new features
- **Minor** (`0.X.0`): new feature or feature group released
- **Major** (`X.0.0`): breaking change or major milestone

**When to bump:**
- Bump **minor** once when a new feature is complete — in the same commit that finishes the feature
- Fixes and tweaks made *during* feature development do not bump the version
- Bump **patch** for bugs found *after* a version has been released

---

## Coding Conventions

### Go
- Method names on `App` struct use PascalCase (they become JS bindings)
- Return `(result string, err error)` for fallible operations
- Shell script execution goes through a helper in `app.go`, not inline

### React / TypeScript
- Prefer functional components with hooks
- Use MUI components for layout and interactive elements
- Use Tailwind for spacing, sizing, and custom styling
- Keep components small — split if a file exceeds ~150 lines

---

## Claude Behavior Rules

- Always read a file before editing it
- Do not modify `wailsjs/` — it is auto-generated
- Do not add dependencies without a clear reason tied to the spec
- Prefer extending `app.go` over creating new Go files unless a package boundary makes sense
- When in doubt about scope, refer back to the Core Requirements above
- Before every commit, write unit tests for the changed code and ensure all tests pass
- After completing a task, always create a git commit with a concise message describing what was done, then push to remote