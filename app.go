package main

import (
	"context"
	"fmt"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"zeonta/internal/executor"
	"zeonta/internal/store"
)

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
func (a *App) RunTool(input executor.RunInput) executor.RunResult {
	tool, err := a.store.GetTool(input.ToolID)
	if err != nil {
		return executor.RunResult{Error: "tool not found"}
	}

	result := executor.Run(tool, input, func(line string) {
		runtime.EventsEmit(a.ctx, "tool:output", line)
	})

	runtime.EventsEmit(a.ctx, "tool:done", result)
	return result
}
