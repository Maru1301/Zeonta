export type TabKind = 'tool' | 'new-tool' | 'history-detail' | 'trash-detail' | 'environment-edit'

export type ActiveFunction = 'tools' | 'history' | 'trash' | 'export' | 'environments'

export interface AppTab {
  id: string
  kind: TabKind
  title: string
  toolId?: string          // 'tool' and 'trash-detail'
  entryId?: string         // 'history-detail'
  environmentId?: string   // 'environment-edit'
}

export interface SlotState {
  tabs: AppTab[]
  activeTabIndex: number
}

export interface TabState {
  slots: [SlotState, SlotState]
  activeSlot: 0 | 1
  splitEnabled: boolean
}

export type RightSidebarContent =
  | { kind: 'versions'; toolId: string; initialVersionId?: string }
  | null

// ── Helpers ────────────────────────────────────────────────

export const initialTabState: TabState = {
  slots: [
    { tabs: [], activeTabIndex: 0 },
    { tabs: [], activeTabIndex: 0 },
  ],
  activeSlot: 0,
  splitEnabled: false,
}

export function getActiveTab(state: TabState): AppTab | null {
  const slot = state.slots[state.activeSlot]
  return slot.tabs[slot.activeTabIndex] ?? null
}

export function getSlotActiveTab(slot: SlotState): AppTab | null {
  return slot.tabs[slot.activeTabIndex] ?? null
}
