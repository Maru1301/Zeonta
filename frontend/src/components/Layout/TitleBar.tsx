import { useState, useEffect } from 'react'
import { Box, Typography, IconButton, Divider, Tooltip } from '@mui/material'
import RemoveIcon from '@mui/icons-material/Remove'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import FilterNoneIcon from '@mui/icons-material/FilterNone'
import CloseIcon from '@mui/icons-material/Close'
import BorderLeftIcon from '@mui/icons-material/BorderLeft'
import BorderBottomIcon from '@mui/icons-material/BorderBottom'
import BorderRightIcon from '@mui/icons-material/BorderRight'
import logo from '../../assets/images/zeonta-256.png'
import {
  WindowMinimise,
  WindowToggleMaximise,
  WindowIsMaximised,
  Quit,
} from '../../../wailsjs/runtime/runtime'

interface Props {
  leftPanelOpen: boolean
  onToggleLeftPanel: () => void
  bottomPanelOpen: boolean
  onToggleBottomPanel: () => void
  rightSidebarVisible: boolean
  onToggleRightSidebar: () => void
}

export default function TitleBar({
  leftPanelOpen, onToggleLeftPanel,
  bottomPanelOpen, onToggleBottomPanel,
  rightSidebarVisible, onToggleRightSidebar,
}: Props) {
  const [isMaximised, setIsMaximised] = useState(false)

  useEffect(() => {
    WindowIsMaximised().then(setIsMaximised)
  }, [])

  const handleToggleMaximise = () => {
    WindowToggleMaximise()
    setIsMaximised(prev => !prev)
  }

  const panelBtnSx = (active: boolean) => ({
    borderRadius: 0,
    width: 36,
    height: '100%',
    color: active ? 'primary.main' : 'text.secondary',
    '&:hover': { bgcolor: 'action.hover', color: active ? 'primary.light' : 'text.primary' },
  })

  return (
    <Box
      sx={{
        height: 32,
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        userSelect: 'none',
      }}
      style={{ '--wails-draggable': 'drag' } as React.CSSProperties}
    >
      {/* Logo + name */}
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 2, pr: 1 }}
        style={{ '--wails-draggable': 'no-drag' } as React.CSSProperties}
      >
        <Box component="img" src={logo} alt="Zeonta" sx={{ height: 18, display: 'block' }} />
        <Typography
          variant="caption"
          sx={{ color: 'text.disabled', fontWeight: 600, letterSpacing: '0.08em' }}
        >
          ZEONTA
        </Typography>
      </Box>

      {/* Drag region */}
      <Box sx={{ flex: 1, height: '100%' }} onDoubleClick={handleToggleMaximise} />

      {/* Panel toggles + window controls */}
      <Box
        sx={{ display: 'flex', height: '100%', alignItems: 'center' }}
        style={{ '--wails-draggable': 'no-drag' } as React.CSSProperties}
      >
        <Tooltip title={leftPanelOpen ? 'Hide left panel' : 'Show left panel'} placement="bottom">
          <IconButton size="small" onClick={onToggleLeftPanel} sx={panelBtnSx(leftPanelOpen)}>
            <BorderLeftIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title={bottomPanelOpen ? 'Hide bottom panel' : 'Show bottom panel'} placement="bottom">
          <IconButton size="small" onClick={onToggleBottomPanel} sx={panelBtnSx(bottomPanelOpen)}>
            <BorderBottomIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title={rightSidebarVisible ? 'Hide right panel' : 'Show right panel'} placement="bottom">
          <IconButton size="small" onClick={onToggleRightSidebar} sx={panelBtnSx(rightSidebarVisible)}>
            <BorderRightIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

        <IconButton
          size="small"
          onClick={WindowMinimise}
          sx={{ borderRadius: 0, width: 46, height: '100%', color: 'text.secondary', '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } }}
        >
          <RemoveIcon sx={{ fontSize: 14 }} />
        </IconButton>
        <IconButton
          size="small"
          onClick={handleToggleMaximise}
          sx={{ borderRadius: 0, width: 46, height: '100%', color: 'text.secondary', '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } }}
        >
          {isMaximised
            ? <FilterNoneIcon sx={{ fontSize: 12 }} />
            : <CheckBoxOutlineBlankIcon sx={{ fontSize: 14 }} />}
        </IconButton>
        <IconButton
          size="small"
          onClick={Quit}
          sx={{ borderRadius: 0, width: 46, height: '100%', color: 'text.secondary', '&:hover': { bgcolor: '#c42b1c', color: '#fff' } }}
        >
          <CloseIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>
    </Box>
  )
}
