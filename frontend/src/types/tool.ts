// Re-export Wails-generated types as the canonical types for the app.
// Components should import from here, not directly from wailsjs/go/models.
import type { store, executor } from '../../wailsjs/go/models'

export type Tool = store.Tool
export type ToolSummary = store.ToolSummary
export type Param = store.Param
export type RunInput = executor.RunInput
export type RunResult = executor.RunResult
export type ToolType = 'powershell' | 'cmd' | 'bash' | 'applescript' | 'python' | 'go'
export type Platform = 'windows' | 'darwin' | 'linux'

export const toolTypeConfig: Record<ToolType, {
  label: string
  platforms: Platform[] | 'all'
  chipBg: string
  chipColor: { dark: string; light: string }
}> = {
  powershell:  { label: 'PowerShell',  platforms: ['windows'],         chipBg: 'rgba(96,165,250,0.15)',  chipColor: { dark: '#60a5fa', light: '#2563eb' } },
  cmd:         { label: 'CMD/Batch',   platforms: ['windows'],         chipBg: 'rgba(167,139,250,0.15)', chipColor: { dark: '#a78bfa', light: '#7c3aed' } },
  bash:        { label: 'Bash/Zsh',    platforms: ['darwin', 'linux'], chipBg: 'rgba(74,222,128,0.15)',  chipColor: { dark: '#4ade80', light: '#16a34a' } },
  applescript: { label: 'AppleScript', platforms: ['darwin'],          chipBg: 'rgba(251,146,60,0.15)',  chipColor: { dark: '#fb923c', light: '#ea580c' } },
  python:      { label: 'Python',      platforms: 'all',               chipBg: 'rgba(250,204,21,0.15)',  chipColor: { dark: '#facc15', light: '#ca8a04' } },
  go:          { label: 'Go',          platforms: 'all',               chipBg: 'rgba(99,179,237,0.15)',  chipColor: { dark: '#63b3ed', light: '#2563eb' } },
}

export function isTypeAvailable(type: ToolType, platform: Platform): boolean {
  const cfg = toolTypeConfig[type]
  return cfg.platforms === 'all' || (cfg.platforms as Platform[]).includes(platform)
}
export type Environment = store.Environment
export type EnvironmentSummary = store.EnvironmentSummary
export type EnvEntry = store.EnvEntry
export type HistorySummary = store.HistorySummary
export type HistoryEntry = store.HistoryEntry
export type ToolVersionSummary = store.ToolVersionSummary
export type ToolVersion = store.ToolVersion
export type DeletedToolSummary = store.DeletedToolSummary
