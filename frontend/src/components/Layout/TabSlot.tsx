import { Box } from '@mui/material'
import type { SlotState } from '../../types/tabs'
import type { Tool, ToolSummary, EnvironmentSummary } from '../../types/tool'
import TabBar from './TabBar'
import ContentArea from '../ContentArea/ContentArea'
import HistoryPanel from '../History/HistoryPanel'
import TrashPanel from '../Versions/TrashPanel'
import ExportPanel from '../Exports/ExportPanel'
import EnvironmentPanel from '../Environments/EnvironmentPanel'
import EmptyState from '../ContentArea/EmptyState'

interface Props {
  slot: SlotState
  slotIndex: 0 | 1
  isActiveSlot: boolean
  splitEnabled: boolean
  onActivateTab: (slotIndex: 0 | 1, tabIndex: number) => void
  onCloseTab: (slotIndex: 0 | 1, tabIndex: number) => void
  onToggleSplit: () => void
  onSlotClick: (slotIndex: 0 | 1) => void
  // data
  toolCache: Record<string, Tool>
  tools: ToolSummary[]
  runCount: number
  trashCount: number
  activeEnvironment: EnvironmentSummary | null
  // callbacks
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
}

export default function TabSlot({
  slot, slotIndex, isActiveSlot, splitEnabled,
  onActivateTab, onCloseTab, onToggleSplit, onSlotClick,
  toolCache, tools, runCount, trashCount, activeEnvironment,
  onEdit, onVersions, onRun, onToolDeleted, onViewVersion,
  onExport, onActiveEnvironmentChanged, onImport,
  onRestored, onTrashCleared,
}: Props) {
  const activeTab = slot.tabs[slot.activeTabIndex] ?? null

  const renderContent = () => {
    if (!activeTab) return <EmptyState />

    switch (activeTab.kind) {
      case 'tool': {
        const tool = activeTab.toolId ? (toolCache[activeTab.toolId] ?? null) : null
        return (
          <ContentArea
            tool={tool}
            onEdit={onEdit}
            onRun={(paramValues) => activeTab.toolId && onRun(activeTab.toolId, paramValues)}
            onDeleted={onToolDeleted}
            onVersions={() => activeTab.toolId && onVersions(activeTab.toolId)}
          />
        )
      }
      case 'history':
        return (
          <HistoryPanel
            tools={tools}
            runCount={runCount}
            onClose={() => onCloseTab(slotIndex, slot.activeTabIndex)}
            onViewVersion={onViewVersion}
          />
        )
      case 'trash':
        return (
          <TrashPanel
            refreshSignal={trashCount}
            onClose={() => onCloseTab(slotIndex, slot.activeTabIndex)}
            onRestored={onRestored}
            onTrashCleared={onTrashCleared}
          />
        )
      case 'export':
        return (
          <ExportPanel
            tools={tools}
            onExport={onExport}
            onClose={() => onCloseTab(slotIndex, slot.activeTabIndex)}
          />
        )
      case 'environment':
        return (
          <EnvironmentPanel
            onClose={() => onCloseTab(slotIndex, slot.activeTabIndex)}
            onActiveChanged={onActiveEnvironmentChanged}
          />
        )
      default:
        return <EmptyState />
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'hidden',
        outline: isActiveSlot && splitEnabled ? '1px solid' : 'none',
        outlineColor: 'primary.main',
        outlineOffset: '-1px',
      }}
    >
      <TabBar
        tabs={slot.tabs}
        activeTabIndex={slot.activeTabIndex}
        isActiveSlot={isActiveSlot}
        showSplitButton={slotIndex === 0}
        splitEnabled={splitEnabled}
        onActivate={(i) => onActivateTab(slotIndex, i)}
        onClose={(i) => onCloseTab(slotIndex, i)}
        onToggleSplit={onToggleSplit}
        onSlotClick={() => onSlotClick(slotIndex)}
      />
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {renderContent()}
      </Box>
    </Box>
  )
}
