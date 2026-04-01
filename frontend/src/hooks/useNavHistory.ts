import { useRef, useReducer, useCallback } from 'react'
import type { AppTab, TabState } from '../types/tabs'

export interface NavEntry {
  slotIndex: 0 | 1
  tab: AppTab
}

interface NavHistory {
  stack: NavEntry[]
  cursor: number
}

const MAX_HISTORY = 100

export function findTab(tabState: TabState, entry: NavEntry): { slotIndex: 0 | 1; tabIndex: number } | null {
  const tabId = entry.tab.id
  // Try preferred slot first
  const preferred = tabState.slots[entry.slotIndex]
  const idxInPreferred = preferred.tabs.findIndex(t => t.id === tabId)
  if (idxInPreferred !== -1) return { slotIndex: entry.slotIndex, tabIndex: idxInPreferred }

  // Cross-slot fallback (tab may have moved when split was toggled)
  const otherSlot = (entry.slotIndex === 0 ? 1 : 0) as 0 | 1
  const idxInOther = tabState.slots[otherSlot].tabs.findIndex(t => t.id === tabId)
  if (idxInOther !== -1) return { slotIndex: otherSlot, tabIndex: idxInOther }

  return null
}

export function useNavHistory() {
  const historyRef = useRef<NavHistory>({ stack: [], cursor: -1 })
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0)

  const pushNav = useCallback((entry: NavEntry) => {
    const h = historyRef.current
    // Skip duplicate consecutive entry
    if (h.cursor >= 0) {
      const cur = h.stack[h.cursor]
      if (cur.slotIndex === entry.slotIndex && cur.tab.id === entry.tab.id) return
    }
    // Truncate forward stack
    h.stack.splice(h.cursor + 1)
    h.stack.push(entry)
    // Cap size
    if (h.stack.length > MAX_HISTORY) {
      h.stack.shift()
    }
    h.cursor = h.stack.length - 1
    forceUpdate()
  }, [])

  const goBack = useCallback((): NavEntry | null => {
    const h = historyRef.current
    if (h.cursor <= 0) return null
    h.cursor--
    forceUpdate()
    return h.stack[h.cursor]
  }, [])

  const goForward = useCallback((): NavEntry | null => {
    const h = historyRef.current
    if (h.cursor >= h.stack.length - 1) return null
    h.cursor++
    forceUpdate()
    return h.stack[h.cursor]
  }, [])

  const clearNav = useCallback(() => {
    historyRef.current = { stack: [], cursor: -1 }
    forceUpdate()
  }, [])

  const { stack, cursor } = historyRef.current
  const canGoBack = cursor > 0
  const canGoForward = cursor < stack.length - 1

  return { pushNav, goBack, goForward, canGoBack, canGoForward, clearNav }
}
