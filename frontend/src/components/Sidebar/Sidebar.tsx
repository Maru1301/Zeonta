import { Box, Button, Typography, Divider, Tooltip, IconButton } from '@mui/material'
import logo from '../../assets/images/zeonta-256.png'
import AddIcon from '@mui/icons-material/Add'
import LayersIcon from '@mui/icons-material/Layers'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import HistoryIcon from '@mui/icons-material/History'
import DeleteIcon from '@mui/icons-material/Delete'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import type { ToolSummary, EnvironmentSummary } from '../../types/tool'
import type { AppThemeMode } from '../../theme'
import ToolList from './ToolList'
import ResizeHandle from '../Layout/ResizeHandle'

interface Props {
  tools: ToolSummary[]
  selectedToolId: string | null
  activeEnvironment: EnvironmentSummary | null
  onSelectTool: (id: string) => void
  onNewTool: () => void
  onManageEnvironments: () => void
  onExport: () => void
  onImport: () => void
  onHistory: () => void
  onTrash: () => void
  trashCount: number
  themeMode: AppThemeMode
  onToggleTheme: () => void
  collapsed: boolean
  onToggleCollapsed: () => void
  width: number
  onResizeWidth: (w: number) => void
}

export default function Sidebar({
  tools, selectedToolId, activeEnvironment,
  onSelectTool, onNewTool, onManageEnvironments,
  onExport, onImport, onHistory, onTrash, trashCount,
  themeMode, onToggleTheme,
  collapsed, onToggleCollapsed, width, onResizeWidth,
}: Props) {
  const effectiveWidth = collapsed ? 48 : width

  if (collapsed) {
    return (
      <Box
        sx={{
          width: effectiveWidth,
          flexShrink: 0,
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflow: 'hidden',
          py: 1,
          gap: 0.5,
        }}
      >
        <Tooltip title="Expand sidebar" placement="right">
          <IconButton size="small" onClick={onToggleCollapsed} sx={{ color: 'text.secondary' }}>
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider flexItem />

        <Tooltip title="New Tool" placement="right">
          <IconButton size="small" onClick={onNewTool} sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Import" placement="right">
          <IconButton size="small" onClick={onImport} sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
            <FileUploadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Export" placement="right">
          <IconButton size="small" onClick={onExport} sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
            <FileDownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider flexItem />

        <Tooltip title="History" placement="right">
          <IconButton size="small" onClick={onHistory} sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
            <HistoryIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={trashCount > 0 ? `Trash (${trashCount})` : 'Trash'} placement="right">
          <IconButton size="small" onClick={onTrash}
            sx={{ color: trashCount > 0 ? '#f87171' : 'text.secondary', '&:hover': { color: trashCount > 0 ? '#fca5a5' : 'text.primary' } }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={activeEnvironment ? `ENV: ${activeEnvironment.name}` : 'No Environment'} placement="right">
          <IconButton size="small" onClick={onManageEnvironments}
            sx={{ color: activeEnvironment ? '#7c6af7' : 'text.secondary' }}>
            <LayersIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Box sx={{ flex: 1 }} />
        <Divider flexItem />

        <Tooltip title={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} placement="right">
          <IconButton size="small" onClick={onToggleTheme} sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
            {themeMode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexShrink: 0 }}>
      <Box
        sx={{
          width,
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box className="flex items-center gap-2" sx={{ px: 2, py: 1.5 }}>
          <Tooltip title="Collapse sidebar" placement="right">
            <IconButton size="small" onClick={onToggleCollapsed} sx={{ color: 'text.secondary', mr: 0.5 }}>
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Box component="img" src={logo} alt="Zeonta" sx={{ height: 28, display: 'block' }} />
          <Typography variant="h6" sx={{ color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Zeonta
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Tooltip title={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} placement="right">
            <IconButton size="small" onClick={onToggleTheme} sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
              {themeMode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>

        <Divider />

        {/* New Tool + Import/Export */}
        <Box sx={{ px: 1.5, py: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Button fullWidth size="small" startIcon={<AddIcon fontSize="small" />} onClick={onNewTool}
            sx={{ justifyContent: 'flex-start', color: 'text.secondary', '&:hover': { color: 'text.primary', bgcolor: 'action.hover' } }}>
            New Tool
          </Button>
          <Box className="flex gap-1">
            <Button size="small" startIcon={<FileUploadIcon fontSize="small" />} onClick={onImport}
              sx={{ flex: 1, justifyContent: 'flex-start', color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}>
              Import
            </Button>
            <Button size="small" startIcon={<FileDownloadIcon fontSize="small" />} onClick={onExport}
              sx={{ flex: 1, justifyContent: 'flex-start', color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}>
              Export
            </Button>
          </Box>
        </Box>

        <Divider />

        {/* Tool list */}
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          <ToolList tools={tools} selectedToolId={selectedToolId} onSelectTool={onSelectTool} />
          {tools.length === 0 && (
            <Typography variant="body2" sx={{ display: 'block', px: 2.5, py: 2.5, color: 'text.disabled' }}>
              No tools yet. Click "New Tool" to get started.
            </Typography>
          )}
        </Box>

        {/* History + Trash */}
        <Divider />
        <Box sx={{ px: 1.5, py: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Button fullWidth size="small" startIcon={<HistoryIcon fontSize="small" />} onClick={onHistory}
            sx={{ justifyContent: 'flex-start', color: 'text.secondary', '&:hover': { color: 'text.primary', bgcolor: 'action.hover' } }}>
            History
          </Button>
          <Button fullWidth size="small" startIcon={<DeleteIcon fontSize="small" />} onClick={onTrash}
            sx={{ justifyContent: 'flex-start', color: trashCount > 0 ? '#f87171' : 'text.secondary', '&:hover': { color: trashCount > 0 ? '#fca5a5' : 'text.primary', bgcolor: 'action.hover' } }}>
            Trash{trashCount > 0 ? ` (${trashCount})` : ''}
          </Button>
        </Box>

        {/* Environment */}
        <Divider />
        <Box sx={{ px: 1.5, py: 1.5 }}>
          <Button fullWidth size="small" startIcon={<LayersIcon fontSize="small" />} onClick={onManageEnvironments}
            sx={{ justifyContent: 'flex-start', color: activeEnvironment ? '#7c6af7' : 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}>
            {activeEnvironment ? `ENV: ${activeEnvironment.name}` : 'No Environment'}
          </Button>
        </Box>
      </Box>

      <ResizeHandle direction="horizontal" currentSize={width} onResize={onResizeWidth} min={160} max={480} />
    </Box>
  )
}
