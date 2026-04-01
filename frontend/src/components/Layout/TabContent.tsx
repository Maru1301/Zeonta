import type { AppTab } from '../../types/tabs'
import type { Tool, ToolSummary, EnvironmentSummary, Platform } from '../../types/tool'
import ContentArea from '../ContentArea/ContentArea'
import CreatePanel from '../EditPanel/CreatePanel'
import HistoryDetailPanel from './HistoryDetailPanel'
import TrashDetailPanel from './TrashDetailPanel'
import EnvironmentEditPanel from '../Environments/EnvironmentEditPanel'
import EmptyState from '../ContentArea/EmptyState'

interface Props {
  tab: AppTab
  slotIndex: 0 | 1
  tabIndex: number
  toolCache: Record<string, Tool>
  tools: ToolSummary[]
  runCount: number
  activeEnvironment: EnvironmentSummary | null
  onCloseTab: (slotIndex: 0 | 1, tabIndex: number) => void
  onSaved: (id: string) => void
  onRun: (toolId: string, paramValues: Record<string, string>) => void
  onToolDeleted: () => void
  onViewVersion: (toolId: string, versionId: string) => void
  onRestored: (toolId: string) => void
  onEnvironmentSaved: () => void
  onHistoryVersionFound: (entryId: string, toolId: string, versionId: string) => void
  platform: Platform
}

export default function TabContent({
  tab, slotIndex, tabIndex,
  toolCache,
  onCloseTab, onSaved, onRun, onToolDeleted, onViewVersion,
  onRestored, onEnvironmentSaved, onHistoryVersionFound, platform,
}: Props) {
  const closeThis = () => onCloseTab(slotIndex, tabIndex)

  switch (tab.kind) {
    case 'new-tool':
      return <CreatePanel onSaved={onSaved} onClose={closeThis} platform={platform} />

    case 'tool': {
      const tool = tab.toolId ? (toolCache[tab.toolId] ?? null) : null
      return (
        <ContentArea
          tool={tool}
          onSaved={onSaved}
          onRun={(paramValues) => tab.toolId && onRun(tab.toolId, paramValues)}
          onDeleted={onToolDeleted}
          platform={platform}
        />
      )
    }

    case 'history-detail':
      return (
        <HistoryDetailPanel
          entryId={tab.entryId!}
          onViewVersion={(toolId, versionId) => {
            onHistoryVersionFound(tab.entryId!, toolId, versionId)
            onViewVersion(toolId, versionId)
          }}
          onClose={closeThis}
        />
      )

    case 'trash-detail':
      return (
        <TrashDetailPanel
          toolId={tab.toolId!}
          toolName={tab.title}
          onRestored={(toolId) => { onRestored(toolId); closeThis() }}
          onClose={closeThis}
        />
      )

    case 'environment-edit':
      return (
        <EnvironmentEditPanel
          environmentId={tab.environmentId}
          onSaved={() => { onEnvironmentSaved(); closeThis() }}
          onClose={closeThis}
        />
      )

    default:
      return <EmptyState />
  }
}
