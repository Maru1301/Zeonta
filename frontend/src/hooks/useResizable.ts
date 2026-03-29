import { useState, useCallback } from 'react'

export function useResizable(key: string, defaultValue: number): [number, (n: number) => void] {
  const [size, setSize] = useState<number>(() => {
    const stored = localStorage.getItem(key)
    return stored ? parseInt(stored, 10) : defaultValue
  })

  const persist = useCallback((n: number) => {
    setSize(n)
    localStorage.setItem(key, String(n))
  }, [key])

  return [size, persist]
}
