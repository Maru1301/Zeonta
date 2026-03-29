import { useState } from 'react'
import { Box, Typography, IconButton, Tooltip } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import VerticalSplitIcon from '@mui/icons-material/VerticalSplit'
import CallMergeIcon from '@mui/icons-material/CallMerge'
import type { AppTab } from '../../types/tabs'

interface DragSource {
  slotIndex: 0 | 1
  tabIndex: number
}

interface Props {
  tabs: AppTab[]
  activeTabIndex: number
  isActiveSlot: boolean
  showSplitButton: boolean
  splitEnabled: boolean
  slotIndex: 0 | 1
  onActivate: (index: number) => void
  onClose: (index: number) => void
  onToggleSplit: () => void
  onSlotClick: () => void
  // fromSlotIndex, fromTabIndex, toTabIndex (target slot is always this bar's slot)
  onReorder: (fromSlotIndex: 0 | 1, fromTabIndex: number, toTabIndex: number) => void
}

export default function TabBar({
  tabs, activeTabIndex, isActiveSlot,
  showSplitButton, splitEnabled, slotIndex,
  onActivate, onClose, onToggleSplit, onSlotClick, onReorder,
}: Props) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const parseDragSource = (e: React.DragEvent): DragSource | null => {
    try { return JSON.parse(e.dataTransfer.getData('text/plain')) }
    catch { return null }
  }

  const handleDragStart = (e: React.DragEvent, i: number) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify({ slotIndex, tabIndex: i } satisfies DragSource))
  }

  const handleDragOver = (e: React.DragEvent, overIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(overIndex)
  }

  const handleDrop = (e: React.DragEvent, toTabIndex: number) => {
    e.preventDefault()
    const src = parseDragSource(e)
    if (src && (src.slotIndex !== slotIndex || src.tabIndex !== toTabIndex)) {
      onReorder(src.slotIndex, src.tabIndex, toTabIndex)
    }
    setDragOverIndex(null)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverIndex(null)
    }
  }

  return (
    <Box
      onClick={onSlotClick}
      onDragLeave={handleDragLeave}
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
        <Box
          onDragOver={(e) => handleDragOver(e, 0)}
          onDrop={(e) => handleDrop(e, 0)}
          sx={{
            flex: 1, height: 36,
            bgcolor: dragOverIndex === 0 ? 'action.hover' : 'transparent',
            transition: 'background-color 0.1s',
          }}
        />
      )}

      {tabs.map((tab, i) => {
        const isActive = i === activeTabIndex && isActiveSlot
        const isDragOver = dragOverIndex === i
        return (
          <Box
            key={tab.id}
            draggable
            onDragStart={(e) => handleDragStart(e, i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={(e) => handleDrop(e, i)}
            onClick={(e) => { e.stopPropagation(); onActivate(i) }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1.5,
              height: 36,
              flexShrink: 0,
              cursor: 'grab',
              borderRight: '1px solid',
              borderColor: 'divider',
              borderLeft: isDragOver ? '2px solid' : '2px solid transparent',
              borderLeftColor: isDragOver ? 'primary.main' : 'transparent',
              bgcolor: isActive ? 'background.default' : 'transparent',
              borderBottom: isActive ? '2px solid' : '2px solid transparent',
              borderBottomColor: isActive ? 'primary.main' : 'transparent',
              '&:hover': { bgcolor: isActive ? 'background.default' : 'action.hover' },
              '&:active': { cursor: 'grabbing' },
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

      {/* Spacer — drop zone to append at end */}
      <Box
        sx={{
          flex: 1,
          height: 36,
          bgcolor: dragOverIndex === tabs.length ? 'action.hover' : 'transparent',
          transition: 'background-color 0.1s',
        }}
        onDragOver={(e) => handleDragOver(e, tabs.length)}
        onDrop={(e) => handleDrop(e, tabs.length)}
      />

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
