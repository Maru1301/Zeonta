import { useState } from 'react'
import { Box } from '@mui/material'
import type { TabState } from '../../types/tabs'
import type { Tool, ToolSummary, EnvironmentSummary } from '../../types/tool'
import TabBar from './TabBar'
import ResizeHandle from './ResizeHandle'
import TabContent from './TabContent'
import EmptyState from '../ContentArea/EmptyState'

const TAB_BAR_HEIGHT = 36

interface Props {
  tabState: TabState
  splitRatio: number
  onSplitResize: (ratio: number) => void
  onActivateTab: (slotIndex: 0 | 1, tabIndex: number) => void
  onCloseTab: (slotIndex: 0 | 1, tabIndex: number) => void
  onReorderTabs: (fromSlot: 0 | 1, fromIndex: number, toSlot: 0 | 1, toIndex: number) => void
  onToggleSplit: () => void
  onSlotClick: (slotIndex: 0 | 1) => void
  toolCache: Record<string, Tool>
  tools: ToolSummary[]
  runCount: number
  activeEnvironment: EnvironmentSummary | null
  onSaved: (id: string) => void
  onRun: (toolId: string, paramValues: Record<string, string>) => void
  onToolDeleted: () => void
  onViewVersion: (toolId: string, versionId: string) => void
  onRestored: (toolId: string) => void
  onEnvironmentSaved: () => void
  onHistoryVersionFound: (entryId: string, toolId: string, versionId: string) => void
  containerWidth: number
}

export default function MainArea({
  tabState, splitRatio, onSplitResize,
  onActivateTab, onCloseTab, onReorderTabs, onToggleSplit, onSlotClick,
  containerWidth,
  toolCache, tools, runCount, activeEnvironment,
  onSaved, onRun, onToolDeleted, onViewVersion,
  onRestored, onEnvironmentSaved, onHistoryVersionFound,
}: Props) {
  const { slots, activeSlot, splitEnabled } = tabState
  const [dragOverSlot, setDragOverSlot] = useState<0 | 1 | null>(null)

  const parseDropSource = (e: React.DragEvent) => {
    try { return JSON.parse(e.dataTransfer.getData('text/plain')) }
    catch { return null }
  }

  const handleSlotDragOver = (e: React.DragEvent, slotIndex: 0 | 1) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverSlot(slotIndex)
  }

  const handleSlotDrop = (e: React.DragEvent, slotIndex: 0 | 1) => {
    e.preventDefault()
    setDragOverSlot(null)
    const src = parseDropSource(e)
    if (src) onReorderTabs(src.slotIndex, src.tabIndex, slotIndex, slots[slotIndex].tabs.length)
  }

  const handleSplitResize = (newPx: number) => {
    const ratio = Math.max(20, Math.min(80, (newPx / containerWidth) * 100))
    onSplitResize(ratio)
  }

  const hasTabs = slots[0].tabs.length > 0 || slots[1].tabs.length > 0
  const slot0HasTabs = slots[0].tabs.length > 0
  const slot1HasTabs = slots[1].tabs.length > 0
  const slot0Top = slot0HasTabs ? TAB_BAR_HEIGHT : 0
  const slot1Top = splitEnabled ? TAB_BAR_HEIGHT : 0
  const slot0Px = splitEnabled ? (splitRatio / 100) * containerWidth : containerWidth
  const handleWidth = 4
  const slot1Left = slot0Px + handleWidth

  const allTabItems = [
    ...slots[0].tabs.map((tab, i) => ({ tab, slotIndex: 0 as const, tabIndex: i })),
    ...slots[1].tabs.map((tab, i) => ({ tab, slotIndex: 1 as const, tabIndex: i })),
  ]

  const contentProps = {
    toolCache, tools, runCount, activeEnvironment,
    onCloseTab, onSaved, onRun, onToolDeleted, onViewVersion,
    onRestored, onEnvironmentSaved, onHistoryVersionFound,
  }

  return (
    <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
      {/* Slot structure: tab bars only */}
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'row' }}>
        {/* Slot 0 */}
        <Box sx={{
          width: splitEnabled ? `${splitRatio}%` : '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          outline: activeSlot === 0 && splitEnabled ? '1px solid' : 'none',
          outlineColor: 'primary.main',
          outlineOffset: '-1px',
        }}>
          {slot0HasTabs && (
            <TabBar
              tabs={slots[0].tabs}
              activeTabIndex={slots[0].activeTabIndex}
              isActiveSlot={activeSlot === 0}
              showSplitButton={hasTabs}
              splitEnabled={splitEnabled}
              slotIndex={0}
              onActivate={(i) => onActivateTab(0, i)}
              onClose={(i) => onCloseTab(0, i)}
              onReorder={(fromSlot, fromTab, toTab) => onReorderTabs(fromSlot, fromTab, 0, toTab)}
              onToggleSplit={onToggleSplit}
              onSlotClick={() => onSlotClick(0)}
            />
          )}
        </Box>

        {splitEnabled && (
          <>
            <ResizeHandle
              direction="horizontal"
              currentSize={slot0Px}
              onResize={handleSplitResize}
              min={200}
              max={containerWidth - 200}
            />
            {/* Slot 1 */}
            <Box sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              outline: activeSlot === 1 ? '1px solid' : 'none',
              outlineColor: 'primary.main',
              outlineOffset: '-1px',
            }}>
              <TabBar
                tabs={slots[1].tabs}
                activeTabIndex={slots[1].activeTabIndex}
                isActiveSlot={activeSlot === 1}
                showSplitButton={false}
                splitEnabled={splitEnabled}
                slotIndex={1}
                onActivate={(i) => onActivateTab(1, i)}
                onClose={(i) => onCloseTab(1, i)}
                onReorder={(fromSlot, fromTab, toTab) => onReorderTabs(fromSlot, fromTab, 1, toTab)}
                onToggleSplit={onToggleSplit}
                onSlotClick={() => onSlotClick(1)}
              />
            </Box>
          </>
        )}
      </Box>

      {/* Content overlay: all tabs rendered simultaneously with stable keys */}
      {allTabItems.map(({ tab, slotIndex, tabIndex }) => {
        const isActive = tabIndex === slots[slotIndex].activeTabIndex
        const slotVisible = slotIndex === 0 || splitEnabled
        const isVisible = isActive && slotVisible

        const leftPx = slotIndex === 0 ? 0 : slot1Left
        const widthPx = slotIndex === 0 ? slot0Px : containerWidth - slot1Left

        return (
          <Box
            key={tab.id}
            onClick={() => onSlotClick(slotIndex)}
            onDragOver={(e) => handleSlotDragOver(e, slotIndex)}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverSlot(null) }}
            onDrop={(e) => handleSlotDrop(e, slotIndex)}
            sx={{
              position: 'absolute',
              top: slotIndex === 0 ? slot0Top : slot1Top,
              bottom: 0,
              left: leftPx,
              width: widthPx,
              overflow: 'auto',
              display: isVisible ? 'block' : 'none',
              outline: dragOverSlot === slotIndex ? '2px solid' : 'none',
              outlineColor: 'primary.main',
              outlineOffset: '-2px',
            }}
          >
            <TabContent tab={tab} slotIndex={slotIndex} tabIndex={tabIndex} {...contentProps} />
          </Box>
        )
      })}

      {/* Empty state for slots with no tabs */}
      {!slot0HasTabs && (
        <Box
          onDragOver={(e) => handleSlotDragOver(e, 0)}
          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverSlot(null) }}
          onDrop={(e) => handleSlotDrop(e, 0)}
          sx={{
            position: 'absolute', top: 0, bottom: 0, left: 0, width: slot0Px, overflow: 'auto',
            outline: dragOverSlot === 0 ? '2px solid' : 'none',
            outlineColor: 'primary.main',
            outlineOffset: '-2px',
          }}
        >
          <EmptyState />
        </Box>
      )}
      {splitEnabled && !slot1HasTabs && (
        <Box
          onDragOver={(e) => handleSlotDragOver(e, 1)}
          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverSlot(null) }}
          onDrop={(e) => handleSlotDrop(e, 1)}
          sx={{
            position: 'absolute', top: TAB_BAR_HEIGHT, bottom: 0, left: slot1Left, width: containerWidth - slot1Left, overflow: 'auto',
            outline: dragOverSlot === 1 ? '2px solid' : 'none',
            outlineColor: 'primary.main',
            outlineOffset: '-2px',
          }}
        >
          <EmptyState />
        </Box>
      )}
    </Box>
  )
}
