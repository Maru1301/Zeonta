// Re-export Wails-generated types as the canonical types for the app.
// Components should import from here, not directly from wailsjs/go/models.
import type { store, executor } from '../../wailsjs/go/models'

export type Tool = store.Tool
export type ToolSummary = store.ToolSummary
export type Param = store.Param
export type RunInput = executor.RunInput
export type RunResult = executor.RunResult
export type ToolType = 'shell' | 'go'
export type Environment = store.Environment
export type EnvironmentSummary = store.EnvironmentSummary
export type EnvEntry = store.EnvEntry
export type HistorySummary = store.HistorySummary
export type HistoryEntry = store.HistoryEntry
export type ToolVersionSummary = store.ToolVersionSummary
export type ToolVersion = store.ToolVersion
export type DeletedToolSummary = store.DeletedToolSummary
