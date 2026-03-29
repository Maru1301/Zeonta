import { Box } from '@mui/material'

interface Props {
  direction: 'horizontal' | 'vertical'
  onResize: (newSize: number) => void
  currentSize: number
  min?: number
  max?: number
  inverted?: boolean  // for right/top-anchored panels: drag toward center to grow
}

export default function ResizeHandle({ direction, onResize, currentSize, min = 48, max = 1200, inverted = false }: Props) {
  const isHorizontal = direction === 'horizontal'

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const startPos = isHorizontal ? e.clientX : e.clientY
    const startSize = currentSize

    const onMove = (me: MouseEvent) => {
      const raw = isHorizontal
        ? me.clientX - startPos
        : startPos - me.clientY  // dragging up increases height
      const delta = inverted ? -raw : raw
      const next = Math.max(min, Math.min(max, startSize + delta))
      onResize(next)
    }

    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <Box
      onMouseDown={handleMouseDown}
      sx={{
        flexShrink: 0,
        width:  isHorizontal ? '4px' : '100%',
        height: isHorizontal ? '100%' : '4px',
        cursor: isHorizontal ? 'col-resize' : 'row-resize',
        bgcolor: 'divider',
        transition: 'background-color 0.15s',
        '&:hover': { bgcolor: 'primary.main' },
        zIndex: 10,
      }}
    />
  )
}
