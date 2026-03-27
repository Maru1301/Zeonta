import { Box, Button, Typography, Divider } from '@mui/material'
import logo from '../../assets/images/zeonta-256.png'
import AddIcon from '@mui/icons-material/Add'
import LayersIcon from '@mui/icons-material/Layers'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import type { ToolSummary, EnvironmentSummary } from '../../types/tool'
import ToolList from './ToolList'

interface Props {
  tools: ToolSummary[]
  selectedToolId: string | null
  activeEnvironment: EnvironmentSummary | null
  onSelectTool: (id: string) => void
  onNewTool: () => void
  onManageEnvironments: () => void
  onExport: () => void
  onImport: () => void
}

export default function Sidebar({
  tools, selectedToolId, activeEnvironment,
  onSelectTool, onNewTool, onManageEnvironments,
  onExport, onImport,
}: Props) {
  return (
    <Box
      sx={{
        width: 260,
        flexShrink: 0,
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box className="flex items-center gap-2" sx={{ px: 2.5, py: 2 }}>
        <Box component="img" src={logo} alt="Zeonta" sx={{ height: 32, display: 'block' }} />
        <Typography variant="h6" sx={{ color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Zeonta
        </Typography>
      </Box>

      <Divider />

      {/* New Tool + Import/Export */}
      <Box sx={{ px: 1.5, py: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Button
          fullWidth
          size="small"
          startIcon={<AddIcon fontSize="small" />}
          onClick={onNewTool}
          sx={{
            justifyContent: 'flex-start',
            color: 'text.secondary',
            '&:hover': { color: 'text.primary', bgcolor: 'rgba(255,255,255,0.05)' },
          }}
        >
          New Tool
        </Button>
        <Box className="flex gap-1">
          <Button
            size="small"
            startIcon={<FileUploadIcon fontSize="small" />}
            onClick={onImport}
            sx={{ flex: 1, justifyContent: 'flex-start', color: 'text.secondary', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
          >
            Import
          </Button>
          <Button
            size="small"
            startIcon={<FileDownloadIcon fontSize="small" />}
            onClick={onExport}
            sx={{ flex: 1, justifyContent: 'flex-start', color: 'text.secondary', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
          >
            Export
          </Button>
        </Box>
      </Box>

      <Divider />

      {/* Tool list */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <ToolList
          tools={tools}
          selectedToolId={selectedToolId}
          onSelectTool={onSelectTool}
        />
        {tools.length === 0 && (
          <Typography variant="body2" sx={{ display: 'block', px: 2.5, py: 2.5, color: '#555' }}>
            No tools yet. Click "New Tool" to get started.
          </Typography>
        )}
      </Box>

      {/* Environment indicator */}
      <Divider />
      <Box sx={{ px: 1.5, py: 1.5 }}>
        <Button
          fullWidth
          size="small"
          startIcon={<LayersIcon fontSize="small" />}
          onClick={onManageEnvironments}
          sx={{
            justifyContent: 'flex-start',
            color: activeEnvironment ? '#7c6af7' : 'text.secondary',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
          }}
        >
          {activeEnvironment ? `ENV: ${activeEnvironment.name}` : 'No Environment'}
        </Button>
      </Box>
    </Box>
  )
}
