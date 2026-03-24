// Re-export Wails-generated types as the canonical types for the app.
// Components should import from here, not directly from wailsjs/go/models.
export { store as StoreTypes, executor as ExecutorTypes } from '../../wailsjs/go/models'
export type { store, executor } from '../../wailsjs/go/models'

import type { store, executor } from '../../wailsjs/go/models'

export type Tool = store.Tool
export type ToolSummary = store.ToolSummary
export type Param = store.Param
export type EnvVar = store.EnvVar
export type RunInput = executor.RunInput
export type RunResult = executor.RunResult
export type ToolType = 'shell' | 'go'
