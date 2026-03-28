package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"zeonta/internal/executor"
	"zeonta/internal/store"
)

// ImportSummary is returned by ImportTools to report the outcome.
type ImportSummary struct {
	Imported int      `json:"imported"`
	Skipped  []string `json:"skipped"`
}

// exportFile is the JSON envelope written by ExportTools.
type exportFile struct {
	Version string       `json:"version"`
	Tools   []exportTool `json:"tools"`
}

// exportTool is a portable tool record — no ID or timestamp.
type exportTool struct {
	Name   string         `json:"name"`
	Type   store.ToolType `json:"type"`
	Body   string         `json:"body"`
	Desc   string         `json:"desc"`
	Params []store.Param  `json:"params"`
}

// parseImportFile converts raw file bytes into a slice of Tool values.
// Supported formats: .json (Zeonta export), .ps1/.bat (shell script), .go (Go source).
func parseImportFile(filename string, content []byte) ([]store.Tool, error) {
	ext := strings.ToLower(filepath.Ext(filename))
	base := strings.TrimSuffix(filepath.Base(filename), filepath.Ext(filename))

	switch ext {
	case ".json":
		var f exportFile
		if err := json.Unmarshal(content, &f); err != nil {
			return nil, fmt.Errorf("invalid JSON: %w", err)
		}
		tools := make([]store.Tool, len(f.Tools))
		for i, t := range f.Tools {
			tools[i] = store.Tool{Name: t.Name, Type: t.Type, Body: t.Body, Desc: t.Desc, Params: t.Params}
		}
		return tools, nil
	case ".ps1", ".bat":
		return []store.Tool{{Name: base, Type: store.ToolTypeShell, Body: string(content)}}, nil
	case ".go":
		return []store.Tool{{Name: base, Type: store.ToolTypeGo, Body: string(content)}}, nil
	default:
		return nil, fmt.Errorf("unsupported file type %q — use .json, .ps1, .bat, or .go", ext)
	}
}

// App is the main application struct. All public methods become Wails JS bindings.
type App struct {
	ctx   context.Context
	store *store.Store
}

func NewApp(s *store.Store) *App {
	return &App{store: s}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// ListTools returns all saved tools as summaries for the sidebar.
func (a *App) ListTools() []store.ToolSummary {
	return a.store.ListTools()
}

// GetTool returns the full definition of a single tool.
func (a *App) GetTool(id string) (store.Tool, error) {
	t, err := a.store.GetTool(id)
	if err != nil {
		return store.Tool{}, fmt.Errorf("could not load tool: %w", err)
	}
	return t, nil
}

// CreateTool saves a new tool and returns it with its assigned ID.
func (a *App) CreateTool(tool store.Tool) (store.Tool, error) {
	created, err := a.store.CreateTool(tool)
	if err != nil {
		return store.Tool{}, fmt.Errorf("could not create tool: %w", err)
	}
	return created, nil
}

// UpdateTool overwrites an existing tool by ID.
func (a *App) UpdateTool(tool store.Tool) (store.Tool, error) {
	updated, err := a.store.UpdateTool(tool)
	if err != nil {
		return store.Tool{}, fmt.Errorf("could not update tool: %w", err)
	}
	return updated, nil
}

// DeleteTool permanently removes a tool by ID.
func (a *App) DeleteTool(id string) error {
	if err := a.store.DeleteTool(id); err != nil {
		return fmt.Errorf("could not delete tool: %w", err)
	}
	return nil
}

// RunTool executes a tool, streaming output via Wails events.
// Env vars are sourced from the currently active environment set.
// Each run is recorded to history automatically.
func (a *App) RunTool(input executor.RunInput) executor.RunResult {
	tool, err := a.store.GetTool(input.ToolID)
	if err != nil {
		return executor.RunResult{Error: "tool not found"}
	}

	envVars := a.store.GetActiveEnvVars()

	result := executor.Run(tool, input, envVars, func(line string) {
		runtime.EventsEmit(a.ctx, "tool:output", line)
	})

	// Capture the current version ID so history entries link back to the snapshot.
	versionID := ""
	if vs := a.store.ListVersions(tool.ID); len(vs) > 0 {
		versionID = vs[0].ID
	}
	_ = a.store.RecordRun(tool.ID, tool.Name, versionID, result.ExitCode, result.Output, result.Error)

	runtime.EventsEmit(a.ctx, "tool:done", result)
	return result
}

// --- Version methods ---

// ListToolVersions returns all version summaries for a tool, newest first.
func (a *App) ListToolVersions(toolID string) []store.ToolVersionSummary {
	return a.store.ListVersions(toolID)
}

// GetToolVersion returns the full snapshot for a single version record.
func (a *App) GetToolVersion(id string) (store.ToolVersion, error) {
	v, err := a.store.GetVersion(id)
	if err != nil {
		return store.ToolVersion{}, fmt.Errorf("could not load version: %w", err)
	}
	return v, nil
}

// RestoreToolVersion rolls the live tool back to the given version snapshot
// without recording a new version. The targeted version becomes current again.
func (a *App) RestoreToolVersion(versionID string) (store.Tool, error) {
	tool, err := a.store.RestoreToolVersion(versionID)
	if err != nil {
		return store.Tool{}, fmt.Errorf("could not restore version: %w", err)
	}
	return tool, nil
}

// RunToolVersion executes an old version's script directly without modifying
// the live tool. Uses the current active environment.
func (a *App) RunToolVersion(versionID string, paramValues map[string]string) executor.RunResult {
	v, err := a.store.GetVersion(versionID)
	if err != nil {
		return executor.RunResult{Error: "version not found"}
	}
	tool := store.Tool{ID: v.ToolID, Name: v.Name, Type: v.Type, Body: v.Body, Params: v.Params}
	envVars := a.store.GetActiveEnvVars()
	input := executor.RunInput{ToolID: v.ToolID, ParamValues: paramValues}

	result := executor.Run(tool, input, envVars, func(line string) {
		runtime.EventsEmit(a.ctx, "tool:output", line)
	})

	_ = a.store.RecordRun(v.ToolID, v.Name, v.ID, result.ExitCode, result.Output, result.Error)
	runtime.EventsEmit(a.ctx, "tool:done", result)
	return result
}

// --- Trash methods ---

// ListDeletedTools returns summaries of tools that have been deleted but still
// have version snapshots available for recovery.
func (a *App) ListDeletedTools() []store.DeletedToolSummary {
	return a.store.ListDeletedTools()
}

// RestoreDeletedTool recreates a deleted tool from the specified version,
// reusing its original ID so all prior versions are re-attached.
func (a *App) RestoreDeletedTool(versionID string) (store.Tool, error) {
	tool, err := a.store.RestoreDeletedTool(versionID)
	if err != nil {
		return store.Tool{}, fmt.Errorf("could not restore tool: %w", err)
	}
	return tool, nil
}

// ClearTrash permanently deletes all versions and run history for tools that
// have been deleted. This action cannot be undone.
func (a *App) ClearTrash() error {
	if err := a.store.ClearTrash(); err != nil {
		return fmt.Errorf("could not clear trash: %w", err)
	}
	return nil
}

// ClearTrashByIDs permanently deletes versions and run history for the
// specified deleted tool IDs. Only orphaned tools are affected.
func (a *App) ClearTrashByIDs(toolIDs []string) error {
	if err := a.store.ClearTrashByIDs(toolIDs); err != nil {
		return fmt.Errorf("could not delete selected trash: %w", err)
	}
	return nil
}

// --- History methods ---

// ListHistory returns the latest 200 history summaries.
// Pass toolID="" to list all tools; pass a specific ID to filter by tool.
func (a *App) ListHistory(toolID string) []store.HistorySummary {
	return a.store.ListHistory(toolID)
}

// GetHistoryEntry returns the full record for a single history entry.
func (a *App) GetHistoryEntry(id string) (store.HistoryEntry, error) {
	entry, err := a.store.GetHistoryEntry(id)
	if err != nil {
		return store.HistoryEntry{}, fmt.Errorf("could not load history entry: %w", err)
	}
	return entry, nil
}

// ClearHistory deletes history entries.
// Pass toolID="" to clear all history; pass a specific ID to clear only that tool's history.
func (a *App) ClearHistory(toolID string) error {
	if err := a.store.ClearHistory(toolID); err != nil {
		return fmt.Errorf("could not clear history: %w", err)
	}
	return nil
}

// --- Environment methods ---

// ListEnvironments returns all environment sets as summaries.
func (a *App) ListEnvironments() []store.EnvironmentSummary {
	return a.store.ListEnvironments()
}

// GetEnvironment returns the full definition of a single environment set.
func (a *App) GetEnvironment(id string) (store.Environment, error) {
	e, err := a.store.GetEnvironment(id)
	if err != nil {
		return store.Environment{}, fmt.Errorf("could not load environment: %w", err)
	}
	return e, nil
}

// CreateEnvironment saves a new environment set and returns it with its assigned ID.
func (a *App) CreateEnvironment(env store.Environment) (store.Environment, error) {
	created, err := a.store.CreateEnvironment(env)
	if err != nil {
		return store.Environment{}, fmt.Errorf("could not create environment: %w", err)
	}
	return created, nil
}

// UpdateEnvironment overwrites an existing environment set by ID.
func (a *App) UpdateEnvironment(env store.Environment) (store.Environment, error) {
	updated, err := a.store.UpdateEnvironment(env)
	if err != nil {
		return store.Environment{}, fmt.Errorf("could not update environment: %w", err)
	}
	return updated, nil
}

// DeleteEnvironment permanently removes an environment set by ID.
func (a *App) DeleteEnvironment(id string) error {
	if err := a.store.DeleteEnvironment(id); err != nil {
		return fmt.Errorf("could not delete environment: %w", err)
	}
	return nil
}

// SetActiveEnvironment marks the given environment as active and deactivates all others.
// Pass an empty string to deactivate all environments.
func (a *App) SetActiveEnvironment(id string) error {
	if err := a.store.SetActiveEnvironment(id); err != nil {
		return fmt.Errorf("could not set active environment: %w", err)
	}
	return nil
}

// --- Import / Export ---

// ExportTools opens a native save dialog and writes the selected tools to a JSON file.
// Returns true if the file was written, false if the user cancelled.
func (a *App) ExportTools(ids []string) (bool, error) {
	tools := make([]exportTool, 0, len(ids))
	for _, id := range ids {
		t, err := a.store.GetTool(id)
		if err != nil {
			continue
		}
		tools = append(tools, exportTool{Name: t.Name, Type: t.Type, Body: t.Body, Desc: t.Desc, Params: t.Params})
	}

	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Export Tools",
		DefaultFilename: "zeonta-tools.json",
		Filters:         []runtime.FileFilter{{DisplayName: "JSON (*.json)", Pattern: "*.json"}},
	})
	if err != nil {
		return false, fmt.Errorf("export dialog: %w", err)
	}
	if path == "" {
		return false, nil // cancelled
	}

	data, err := json.MarshalIndent(exportFile{Version: "0.1.0", Tools: tools}, "", "  ")
	if err != nil {
		return false, fmt.Errorf("marshal tools: %w", err)
	}
	return true, os.WriteFile(path, data, 0644)
}

// ImportTools opens a native multi-file dialog and imports tools from .json, .ps1, .bat, or .go files.
// Tools whose names already exist are skipped. Returns an empty summary if the user cancels.
func (a *App) ImportTools() (ImportSummary, error) {
	paths, err := runtime.OpenMultipleFilesDialog(a.ctx, runtime.OpenDialogOptions{
		Title:   "Import Tools",
		Filters: []runtime.FileFilter{{DisplayName: "Zeonta / Scripts (*.json;*.ps1;*.bat;*.go)", Pattern: "*.json;*.ps1;*.bat;*.go"}},
	})
	if err != nil {
		return ImportSummary{Skipped: []string{}}, fmt.Errorf("import dialog: %w", err)
	}
	if len(paths) == 0 {
		return ImportSummary{Skipped: []string{}}, nil // cancelled
	}

	summary := ImportSummary{Skipped: []string{}}
	for _, path := range paths {
		content, err := os.ReadFile(path)
		if err != nil {
			summary.Skipped = append(summary.Skipped, filepath.Base(path))
			continue
		}
		tools, err := parseImportFile(filepath.Base(path), content)
		if err != nil {
			summary.Skipped = append(summary.Skipped, filepath.Base(path))
			continue
		}
		for _, t := range tools {
			if _, err := a.store.CreateTool(t); err != nil {
				summary.Skipped = append(summary.Skipped, t.Name)
			} else {
				summary.Imported++
			}
		}
	}
	return summary, nil
}
