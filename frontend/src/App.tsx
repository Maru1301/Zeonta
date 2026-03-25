import { useState, useEffect, useCallback } from 'react'
import { ThemeProvider, CssBaseline, Box } from '@mui/material'
import { EventsOn } from '../wailsjs/runtime/runtime'
import { ListTools, GetTool, RunTool } from '../wailsjs/go/main/App'
import theme from './theme'
import type { Tool, ToolSummary, RunResult } from './types/tool'
import Sidebar from './components/Sidebar/Sidebar'
import ContentArea from './components/ContentArea/ContentArea'
import EditPanel from './components/EditPanel/EditPanel'
import OutputPanel from './components/OutputPanel/OutputPanel'

export type EditPanelMode = 'create' | 'edit' | 'run' | null

export default function App() {
  const [tools, setTools] = useState<ToolSummary[]>([])
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null)
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [editPanelMode, setEditPanelMode] = useState<EditPanelMode>(null)
  const [outputPanelOpen, setOutputPanelOpen] = useState(false)
  const [outputLines, setOutputLines] = useState<string[]>([])
  const [runResult, setRunResult] = useState<RunResult | null>(null)

  const refreshTools = useCallback(async () => {
    const list = await ListTools()
    setTools(list ?? [])
  }, [])

  useEffect(() => {
    refreshTools()
  }, [refreshTools])

  useEffect(() => {
    const offOutput = EventsOn('tool:output', (line: string) => {
      setOutputLines(prev => [...prev, line])
    })
    const offDone = EventsOn('tool:done', (result: RunResult) => {
      setRunResult(result)
    })
    return () => {
      offOutput()
      offDone()
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="flex h-screen overflow-hidden" sx={{ bgcolor: 'background.default' }}>
        <Sidebar
          tools={tools}
          selectedToolId={selectedToolId}
          onSelectTool={selectTool}
          onNewTool={() => { setSelectedTool(null); setEditPanelMode('create') }}
        />

        <Box className="flex flex-col flex-1 overflow-hidden">
          <Box className="flex-1 overflow-auto">
            <ContentArea
              tool={selectedTool}
              onEdit={() => setEditPanelMode('edit')}
              onRun={() => {
                if (selectedTool && ((selectedTool.params ?? []).length > 0 || (selectedTool.envVars ?? []).length > 0)) {
                  setEditPanelMode('run')
                } else {
                  handleRunStart()
                  if (selectedTool) {
                    RunTool({ toolId: selectedTool.id, paramValues: {}, envVarValues: {} })
                  }
                }
              }}
              onDeleted={handleToolDeleted}
            />
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
            onRunStart={handleRunStart}
            onClose={() => setEditPanelMode(null)}
          />
        )}
      </Box>
    </ThemeProvider>
  )
}
