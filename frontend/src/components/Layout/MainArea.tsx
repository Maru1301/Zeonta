import { Box } from '@mui/material'
import type { TabState } from '../../types/tabs'
import type { Tool, ToolSummary, EnvironmentSummary } from '../../types/tool'
import TabSlot from './TabSlot'
import ResizeHandle from './ResizeHandle'

interface Props {
  tabState: TabState
  splitRatio: number           // percent width of slot 0 (0–100)
  onSplitResize: (ratio: number) => void
  onActivateTab: (slotIndex: 0 | 1, tabIndex: number) => void
  onCloseTab: (slotIndex: 0 | 1, tabIndex: number) => void
  onToggleSplit: () => void
  onSlotClick: (slotIndex: 0 | 1) => void
  // forwarded to TabSlot
  toolCache: Record<string, Tool>
  tools: ToolSummary[]
  runCount: number
  trashCount: number
  activeEnvironment: EnvironmentSummary | null
  onEdit: () => void
  onVersions: (toolId: string) => void
  onRun: (toolId: string, paramValues: Record<string, string>) => void
  onToolDeleted: () => void
  onViewVersion: (toolId: string, versionId: string) => void
  onExport: (ids: string[]) => Promise<boolean>
  onActiveEnvironmentChanged: () => void
  onImport: () => void
  onRestored: (toolId: string) => void
  onTrashCleared: () => void
  containerWidth: number       // needed to convert ratio delta → px → ratio
}

export default function MainArea({
  tabState, splitRatio, onSplitResize,
  onActivateTab, onCloseTab, onToggleSplit, onSlotClick,
  containerWidth,
  ...slotProps
}: Props) {
  const { slots, activeSlot, splitEnabled } = tabState

  const handleSplitResize = (newPx: number) => {
    const ratio = Math.max(20, Math.min(80, (newPx / containerWidth) * 100))
    onSplitResize(ratio)
  }

  const slot0Width = splitEnabled ? `${splitRatio}%` : '100%'
  const slot0Px = (splitRatio / 100) * containerWidth

  return (
    <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      <Box sx={{ width: slot0Width, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TabSlot
          slot={slots[0]}
          slotIndex={0}
          isActiveSlot={activeSlot === 0}
          splitEnabled={splitEnabled}
          onActivateTab={onActivateTab}
          onCloseTab={onCloseTab}
          onToggleSplit={onToggleSplit}
          onSlotClick={onSlotClick}
          {...slotProps}
        />
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
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <TabSlot
              slot={slots[1]}
              slotIndex={1}
              isActiveSlot={activeSlot === 1}
              splitEnabled={splitEnabled}
              onActivateTab={onActivateTab}
              onCloseTab={onCloseTab}
              onToggleSplit={onToggleSplit}
              onSlotClick={onSlotClick}
              {...slotProps}
            />
          </Box>
        </>
      )}
    </Box>
  )
}
