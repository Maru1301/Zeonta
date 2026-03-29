import { Box, Tooltip, IconButton, Divider, Badge } from '@mui/material'
import BuildIcon from '@mui/icons-material/Build'
import HistoryIcon from '@mui/icons-material/History'
import DeleteIcon from '@mui/icons-material/Delete'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import LayersIcon from '@mui/icons-material/Layers'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import type { ActiveFunction } from '../../types/tabs'
import type { EnvironmentSummary } from '../../types/tool'
import type { AppThemeMode } from '../../theme'

interface Props {
  activeFunction: ActiveFunction
  leftPanelOpen: boolean
  onSelectFunction: (fn: ActiveFunction) => void
  trashCount: number
  activeEnvironment: EnvironmentSummary | null
  themeMode: AppThemeMode
  onToggleTheme: () => void
}

export default function FunctionBar({
  activeFunction, leftPanelOpen, onSelectFunction,
  trashCount, activeEnvironment, themeMode, onToggleTheme,
}: Props) {
  const isActive = (fn: ActiveFunction) => leftPanelOpen && activeFunction === fn

  const btnSx = (fn: ActiveFunction) => ({
    width: 40,
    height: 40,
    borderRadius: 1,
    color: isActive(fn) ? 'primary.main' : 'text.secondary',
    bgcolor: isActive(fn) ? 'action.selected' : 'transparent',
    '&:hover': {
      color: isActive(fn) ? 'primary.light' : 'text.primary',
      bgcolor: 'action.hover',
    },
  })

  return (
    <Box sx={{
      width: 48,
      flexShrink: 0,
      bgcolor: 'background.paper',
      borderRight: '1px solid',
      borderColor: 'divider',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      py: 1,
      gap: 0.5,
    }}>
      <Tooltip title="Tools" placement="right">
        <IconButton size="small" onClick={() => onSelectFunction('tools')} sx={btnSx('tools')}>
          <BuildIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="History" placement="right">
        <IconButton size="small" onClick={() => onSelectFunction('history')} sx={btnSx('history')}>
          <HistoryIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title={trashCount > 0 ? `Trash (${trashCount})` : 'Trash'} placement="right">
        <IconButton size="small" onClick={() => onSelectFunction('trash')} sx={btnSx('trash')}>
          <Badge badgeContent={trashCount > 0 ? trashCount : undefined} color="error" max={99}>
            <DeleteIcon
              fontSize="small"
              sx={{ color: trashCount > 0 && !isActive('trash') ? '#f87171' : undefined }}
            />
          </Badge>
        </IconButton>
      </Tooltip>

      <Tooltip title="Export" placement="right">
        <IconButton size="small" onClick={() => onSelectFunction('export')} sx={btnSx('export')}>
          <FileDownloadIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip
        title={activeEnvironment ? `Environments · ${activeEnvironment.name}` : 'Environments'}
        placement="right"
      >
        <IconButton size="small" onClick={() => onSelectFunction('environments')} sx={btnSx('environments')}>
          <LayersIcon
            fontSize="small"
            sx={{ color: activeEnvironment && !isActive('environments') ? '#7c6af7' : undefined }}
          />
        </IconButton>
      </Tooltip>

      <Box sx={{ flex: 1 }} />
      <Divider flexItem />

      <Tooltip title={themeMode === 'dark' ? 'Light mode' : 'Dark mode'} placement="right">
        <IconButton
          size="small"
          onClick={onToggleTheme}
          sx={{
            width: 40, height: 40, borderRadius: 1,
            color: 'text.secondary',
            '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
          }}
        >
          {themeMode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
    </Box>
  )
}
