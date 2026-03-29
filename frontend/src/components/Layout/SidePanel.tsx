import { Box, Button, Typography, Divider } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import type { ActiveFunction } from '../../types/tabs'
import type { ToolSummary } from '../../types/tool'
import ToolList from '../Sidebar/ToolList'
import HistoryPanel from '../History/HistoryPanel'
import TrashPanel from '../Versions/TrashPanel'
import ExportPanel from '../Exports/ExportPanel'
import EnvironmentPanel from '../Environments/EnvironmentPanel'
import ResizeHandle from './ResizeHandle'

interface Props {
  activeFunction: ActiveFunction
  open: boolean
  width: number
  onResizeWidth: (w: number) => void
  // Tools
  tools: ToolSummary[]
  selectedToolId: string | null
  onSelectTool: (id: string) => void
  onNewTool: () => void
  onImport: () => void
  // History
  runCount: number
  onSelectHistoryEntry: (id: string, toolName: string) => void
  // Trash
  trashCount: number
  onRestored: (toolId: string) => void
  onTrashCleared: () => void
  onSelectTrashTool: (toolId: string, toolName: string) => void
  // Export
  onExport: (ids: string[]) => Promise<boolean>
  // Environments
  envRefreshSignal: number
  onNewEnvironment: () => void
  onEditEnvironment: (id: string) => void
  onActiveEnvironmentChanged: () => void
}

export default function SidePanel({
  activeFunction, open, width, onResizeWidth,
  tools, selectedToolId, onSelectTool, onNewTool, onImport,
  runCount, onSelectHistoryEntry,
  trashCount, onRestored, onTrashCleared, onSelectTrashTool,
  onExport,
  envRefreshSignal, onNewEnvironment, onEditEnvironment, onActiveEnvironmentChanged,
}: Props) {
  if (!open) return null

  const renderContent = () => {
    switch (activeFunction) {
      case 'tools':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <Box sx={{ px: 1.5, py: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5, flexShrink: 0 }}>
              <Button
                fullWidth size="small"
                startIcon={<AddIcon fontSize="small" />}
                onClick={onNewTool}
                sx={{ justifyContent: 'flex-start', color: 'text.secondary', '&:hover': { color: 'text.primary', bgcolor: 'action.hover' } }}
              >
                New Tool
              </Button>
              <Button
                fullWidth size="small"
                startIcon={<FileUploadIcon fontSize="small" />}
                onClick={onImport}
                sx={{ justifyContent: 'flex-start', color: 'text.secondary', '&:hover': { color: 'text.primary', bgcolor: 'action.hover' } }}
              >
                Import
              </Button>
            </Box>
            <Divider />
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              <ToolList tools={tools} selectedToolId={selectedToolId} onSelectTool={onSelectTool} />
              {tools.length === 0 && (
                <Typography variant="body2" sx={{ display: 'block', px: 2.5, py: 2.5, color: 'text.disabled' }}>
                  No tools yet.
                </Typography>
              )}
            </Box>
          </Box>
        )

      case 'history':
        return (
          <HistoryPanel tools={tools} runCount={runCount} onSelectEntry={onSelectHistoryEntry} />
        )

      case 'trash':
        return (
          <TrashPanel
            refreshSignal={trashCount}
            onRestored={onRestored}
            onTrashCleared={onTrashCleared}
            onSelectTool={onSelectTrashTool}
          />
        )

      case 'export':
        return (
          <ExportPanel tools={tools} onExport={onExport} onClose={() => {}} />
        )

      case 'environments':
        return (
          <EnvironmentPanel
            refreshSignal={envRefreshSignal}
            onNew={onNewEnvironment}
            onEdit={onEditEnvironment}
            onActiveChanged={onActiveEnvironmentChanged}
          />
        )
    }
  }

  return (
    <Box sx={{ display: 'flex', flexShrink: 0 }}>
      <Box sx={{
        width,
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {renderContent()}
      </Box>
      <ResizeHandle direction="horizontal" currentSize={width} onResize={onResizeWidth} min={160} max={480} />
    </Box>
  )
}
