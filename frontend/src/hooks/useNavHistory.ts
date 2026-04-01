import { useRef, useReducer, useCallback } from 'react'
import type { TabState } from '../types/tabs'

export interface NavEntry {
  slotIndex: 0 | 1
  tabId: string
}

interface NavHistory {
  stack: NavEntry[]
  cursor: number
}

const MAX_HISTORY = 100

export function findTab(tabState: TabState, entry: NavEntry): { slotIndex: 0 | 1; tabIndex: number } | null {
  // Try preferred slot first
  const preferred = tabState.slots[entry.slotIndex]
  const idxInPreferred = preferred.tabs.findIndex(t => t.id === entry.tabId)
  if (idxInPreferred !== -1) return { slotIndex: entry.slotIndex, tabIndex: idxInPreferred }

  // Cross-slot fallback (tab may have moved when split was toggled)
  const otherSlot = (entry.slotIndex === 0 ? 1 : 0) as 0 | 1
  const idxInOther = tabState.slots[otherSlot].tabs.findIndex(t => t.id === entry.tabId)
  if (idxInOther !== -1) return { slotIndex: otherSlot, tabIndex: idxInOther }

  return null
}

export function useNavHistory(tabState: TabState) {
  const historyRef = useRef<NavHistory>({ stack: [], cursor: -1 })
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0)

  const pushNav = useCallback((entry: NavEntry) => {
    const h = historyRef.current
    // Skip duplicate consecutive entry
    if (h.cursor >= 0) {
      const cur = h.stack[h.cursor]
      if (cur.slotIndex === entry.slotIndex && cur.tabId === entry.tabId) return
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

  const goBack = useCallback((tabState: TabState): NavEntry | null => {
    const h = historyRef.current
    let i = h.cursor - 1
    while (i >= 0) {
      const entry = h.stack[i]
      if (findTab(tabState, entry) !== null) {
        h.cursor = i
        forceUpdate()
        return entry
      }
      i--
    }
    return null
  }, [])

  const goForward = useCallback((tabState: TabState): NavEntry | null => {
    const h = historyRef.current
    let i = h.cursor + 1
    while (i < h.stack.length) {
      const entry = h.stack[i]
      if (findTab(tabState, entry) !== null) {
        h.cursor = i
        forceUpdate()
        return entry
      }
      i++
    }
    return null
  }, [])

  const { stack, cursor } = historyRef.current

  let canGoBack = false
  for (let i = cursor - 1; i >= 0; i--) {
    if (findTab(tabState, stack[i]) !== null) { canGoBack = true; break }
  }

  let canGoForward = false
  for (let i = cursor + 1; i < stack.length; i++) {
    if (findTab(tabState, stack[i]) !== null) { canGoForward = true; break }
  }

  return { pushNav, goBack, goForward, canGoBack, canGoForward }
}
