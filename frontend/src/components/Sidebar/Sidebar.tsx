import { Box, Button, Typography, Divider } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import LayersIcon from '@mui/icons-material/Layers'
import type { ToolSummary, EnvironmentSummary } from '../../types/tool'
import ToolList from './ToolList'

interface Props {
  tools: ToolSummary[]
  selectedToolId: string | null
  activeEnvironment: EnvironmentSummary | null
  onSelectTool: (id: string) => void
  onNewTool: () => void
  onManageEnvironments: () => void
}

export default function Sidebar({ tools, selectedToolId, activeEnvironment, onSelectTool, onNewTool, onManageEnvironments }: Props) {
  return (
    <Box
      sx={{
        width: 240,
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
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', letterSpacing: '0.05em', fontSize: 11, textTransform: 'uppercase' }}>
          Zeonta
        </Typography>
      </Box>

      <Divider />

      {/* New Tool button */}
      <Box sx={{ px: 1.5, py: 1 }}>
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
          <Typography variant="caption" sx={{ display: 'block', px: 2, py: 2, color: '#555' }}>
            No tools yet. Click "New Tool" to get started.
          </Typography>
        )}
      </Box>

      {/* Environment indicator */}
      <Divider />
      <Box sx={{ px: 1.5, py: 1 }}>
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
