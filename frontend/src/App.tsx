import { useState, useEffect, useCallback } from 'react'
import { ThemeProvider, CssBaseline, Box, Snackbar, Alert } from '@mui/material'
import { EventsOn } from '../wailsjs/runtime/runtime'
import { ListTools, GetTool, RunTool, ListEnvironments, ExportTools, ImportTools } from '../wailsjs/go/main/App'
import HistoryPanel from './components/History/HistoryPanel'
import theme from './theme'
import type { Tool, ToolSummary, RunResult, EnvironmentSummary } from './types/tool'
import Sidebar from './components/Sidebar/Sidebar'
import ContentArea from './components/ContentArea/ContentArea'
import EditPanel from './components/EditPanel/EditPanel'
import OutputPanel from './components/OutputPanel/OutputPanel'
import EnvironmentPanel from './components/Environments/EnvironmentPanel'
import ExportPanel from './components/Exports/ExportPanel'

export type EditPanelMode = 'create' | 'edit' | null

export default function App() {
  const [tools, setTools] = useState<ToolSummary[]>([])
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null)
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [editPanelMode, setEditPanelMode] = useState<EditPanelMode>(null)
  const [outputPanelOpen, setOutputPanelOpen] = useState(false)
  const [outputLines, setOutputLines] = useState<string[]>([])
  const [runResult, setRunResult] = useState<RunResult | null>(null)
  const [runCount, setRunCount] = useState(0)
  const [environmentPanelOpen, setEnvironmentPanelOpen] = useState(false)
  const [activeEnvironment, setActiveEnvironment] = useState<EnvironmentSummary | null>(null)

  const refreshTools = useCallback(async () => {
    const list = await ListTools()
    setTools(list ?? [])
  }, [])

  const refreshActiveEnvironment = useCallback(async () => {
    const list = await ListEnvironments()
    setActiveEnvironment((list ?? []).find(e => e.isActive) ?? null)
  }, [])

  useEffect(() => {
    let retryTimer: ReturnType<typeof setTimeout>
    const init = async () => {
      try {
        await refreshTools()
        await refreshActiveEnvironment()
      } catch {
        // Wails bridge not ready yet (dev hot-reload race) — retry shortly
        retryTimer = setTimeout(init, 100)
      }
    }
    init()
    return () => clearTimeout(retryTimer)
  }, [refreshTools, refreshActiveEnvironment])

  useEffect(() => {
    let offOutput: (() => void) | undefined
    let offDone: (() => void) | undefined
    let retryTimer: ReturnType<typeof setTimeout>

    const register = () => {
      try {
        offOutput = EventsOn('tool:output', (line: string) => {
          setOutputLines(prev => [...prev, line])
        })
        offDone = EventsOn('tool:done', (result: RunResult) => {
          setRunResult(result)
          setRunCount(c => c + 1)
        })
      } catch {
        // Wails bridge not ready yet (dev hot-reload race) — retry shortly
        retryTimer = setTimeout(register, 100)
      }
    }

    register()

    return () => {
      clearTimeout(retryTimer)
      offOutput?.()
      offDone?.()
    }
  }, [])

  const selectTool = useCallback(async (id: string) => {
    setSelectedToolId(id)
    try {
      const tool = await GetTool(id)
      setSelectedTool(tool)
    } catch {
      setSelectedTool(null)
    }
  }, [])

  const handleToolSaved = useCallback(async (id: string) => {
    await refreshTools()
    await selectTool(id)
    setEditPanelMode(null)
  }, [refreshTools, selectTool])

  const handleToolDeleted = useCallback(async () => {
    await refreshTools()
    setSelectedToolId(null)
    setSelectedTool(null)
    setEditPanelMode(null)
  }, [refreshTools])

  const handleRunStart = useCallback(() => {
    setOutputLines([])
    setRunResult(null)
    setOutputPanelOpen(true)
    setEditPanelMode(null)
  }, [])

  const [exportPanelOpen, setExportPanelOpen] = useState(false)
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false)

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  })
  const showSnackbar = useCallback((message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }, [])

  const handleExport = useCallback(async (ids: string[]): Promise<boolean> => {
    try {
      const exported = await ExportTools(ids)
      if (exported) showSnackbar('Tools exported successfully', 'success')
      return exported
    } catch (e: any) {
      showSnackbar(`Export failed: ${e}`, 'error')
      return false
    }
  }, [showSnackbar])

  const handleImport = useCallback(async () => {
    try {
      const result = await ImportTools()
      if (result.imported === 0 && result.skipped.length === 0) return // cancelled
      const skippedPart = result.skipped.length > 0 ? ` · Skipped: ${result.skipped.join(', ')}` : ''
      showSnackbar(`Imported ${result.imported} tool${result.imported !== 1 ? 's' : ''}${skippedPart}`, 'success')
      await refreshTools()
    } catch (e: any) {
      showSnackbar(`Import failed: ${e}`, 'error')
    }
  }, [refreshTools, showSnackbar])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="flex h-screen overflow-hidden" sx={{ bgcolor: 'background.default' }}>
        <Sidebar
          tools={tools}
          selectedToolId={selectedToolId}
          activeEnvironment={activeEnvironment}
          onSelectTool={selectTool}
          onNewTool={() => { setSelectedTool(null); setEditPanelMode('create') }}
          onManageEnvironments={() => setEnvironmentPanelOpen(true)}
          onExport={() => setExportPanelOpen(true)}
          onImport={handleImport}
          onHistory={() => setHistoryPanelOpen(true)}
        />

        <Box className="flex flex-col flex-1 overflow-hidden">
          <Box className="flex-1 overflow-auto">
            {exportPanelOpen ? (
              <ExportPanel
                tools={tools}
                onExport={handleExport}
                onClose={() => setExportPanelOpen(false)}
              />
            ) : (
              <ContentArea
                tool={selectedTool}
                onEdit={() => setEditPanelMode('edit')}
                onRun={(paramValues) => {
                  handleRunStart()
                  if (selectedTool) {
                    RunTool({ toolId: selectedTool.id, paramValues })
                  }
                }}
                onDeleted={handleToolDeleted}
              />
            )}
          </Box>
          {outputPanelOpen && (
            <OutputPanel
              tool={selectedTool}
              lines={outputLines}
              result={runResult}
              onClose={() => setOutputPanelOpen(false)}
            />
          )}
        </Box>

        {editPanelMode !== null && (
          <EditPanel
            mode={editPanelMode}
            tool={selectedTool}
            onSaved={handleToolSaved}
            onClose={() => setEditPanelMode(null)}
          />
        )}

        {environmentPanelOpen && (
          <EnvironmentPanel
            onClose={() => setEnvironmentPanelOpen(false)}
            onActiveChanged={refreshActiveEnvironment}
          />
        )}

        {historyPanelOpen && (
          <HistoryPanel
            tools={tools}
            runCount={runCount}
            onClose={() => setHistoryPanelOpen(false)}
          />
        )}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  )
}
