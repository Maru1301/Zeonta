import { Box, Typography, IconButton, Tooltip } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import VerticalSplitIcon from '@mui/icons-material/VerticalSplit'
import CallMergeIcon from '@mui/icons-material/CallMerge'
import type { AppTab } from '../../types/tabs'

interface Props {
  tabs: AppTab[]
  activeTabIndex: number
  isActiveSlot: boolean
  showSplitButton: boolean   // only slot 0 shows the split toggle
  splitEnabled: boolean
  onActivate: (index: number) => void
  onClose: (index: number) => void
  onToggleSplit: () => void
  onSlotClick: () => void
}

export default function TabBar({
  tabs, activeTabIndex, isActiveSlot,
  showSplitButton, splitEnabled,
  onActivate, onClose, onToggleSplit, onSlotClick,
}: Props) {
  return (
    <Box
      onClick={onSlotClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        minHeight: 36,
        flexShrink: 0,
        overflowX: 'auto',
        '&::-webkit-scrollbar': { height: 0 },
      }}
    >
      {tabs.length === 0 && (
        <Typography variant="caption" sx={{ px: 2, color: 'text.disabled', userSelect: 'none' }}>
          No tabs open
        </Typography>
      )}

      {tabs.map((tab, i) => {
        const isActive = i === activeTabIndex && isActiveSlot
        return (
          <Box
            key={tab.id}
            onClick={(e) => { e.stopPropagation(); onActivate(i) }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1.5,
              height: 36,
              flexShrink: 0,
              cursor: 'pointer',
              borderRight: '1px solid',
              borderColor: 'divider',
              bgcolor: isActive ? 'background.default' : 'transparent',
              borderBottom: isActive ? '2px solid' : '2px solid transparent',
              borderBottomColor: isActive ? 'primary.main' : 'transparent',
              '&:hover': { bgcolor: isActive ? 'background.default' : 'action.hover' },
            }}
          >
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: isActive ? 'text.primary' : 'text.secondary',
                fontWeight: isActive ? 500 : 400,
                maxWidth: 140,
                userSelect: 'none',
              }}
            >
              {tab.title}
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onClose(i) }}
              sx={{
                p: 0.25,
                color: 'text.disabled',
                '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
              }}
            >
              <CloseIcon sx={{ fontSize: 12 }} />
            </IconButton>
          </Box>
        )
      })}

      <Box sx={{ flex: 1 }} />

      {showSplitButton && (
        <Tooltip title={splitEnabled ? 'Close split' : 'Split editor'} placement="bottom">
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onToggleSplit() }}
            sx={{ mx: 0.5, color: splitEnabled ? 'primary.main' : 'text.secondary', '&:hover': { color: 'text.primary' } }}
          >
            {splitEnabled ? <CallMergeIcon fontSize="small" /> : <VerticalSplitIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      )}
    </Box>
  )
}
