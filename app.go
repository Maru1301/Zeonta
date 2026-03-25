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
// Env vars are sourced from the currently active environment set.
func (a *App) RunTool(input executor.RunInput) executor.RunResult {
	tool, err := a.store.GetTool(input.ToolID)
	if err != nil {
		return executor.RunResult{Error: "tool not found"}
	}

	envVars := a.store.GetActiveEnvVars()

	result := executor.Run(tool, input, envVars, func(line string) {
		runtime.EventsEmit(a.ctx, "tool:output", line)
	})

	runtime.EventsEmit(a.ctx, "tool:done", result)
	return result
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
