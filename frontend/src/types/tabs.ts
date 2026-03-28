export type TabKind = 'tool' | 'history' | 'trash' | 'export' | 'environment'

export interface AppTab {
  id: string       // toolId for 'tool' tabs; kind string for singletons
  kind: TabKind
  title: string
  toolId?: string  // only present when kind === 'tool'
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
  | { kind: 'edit'; mode: 'create' | 'edit' }
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
