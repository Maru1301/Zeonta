import { useEffect, useRef } from 'react'
import { Box, Typography, Chip, IconButton, Divider } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import type { Tool, RunResult } from '../../types/tool'
import ResizeHandle from '../Layout/ResizeHandle'

interface Props {
  tool: Tool | null
  lines: string[]
  result: RunResult | null
  running: boolean
  height: number
  onResize: (h: number) => void
  onClose: () => void
}

export default function OutputPanel({ tool, lines, result, running, height, onResize, onClose }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  const waiting = !running && lines.length === 0 && result === null
  const exitCode = result?.exitCode ?? null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <ResizeHandle direction="vertical" currentSize={height} onResize={onResize} min={80} max={800} />
      <Box
        sx={{
          height,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: '#111',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Box className="flex items-center justify-between" sx={{ px: 2.5, py: 1.5, flexShrink: 0 }}>
          <Box className="flex items-center gap-2">
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              {tool?.name ?? 'Output'}
            </Typography>
            {waiting && (
              <Chip label="waiting" size="small" sx={{ bgcolor: 'rgba(148,163,184,0.15)', color: '#94a3b8' }} />
            )}
            {running && (
              <Chip label="running" size="small" sx={{ bgcolor: 'rgba(251,191,36,0.15)', color: '#fbbf24' }} />
            )}
            {!running && exitCode !== null && (
              <Chip
                label={exitCode === 0 ? 'exit 0' : `exit ${exitCode}`}
                size="small"
                sx={{
                  bgcolor: exitCode === 0 ? 'rgba(34,197,94,0.15)' : 'rgba(248,113,113,0.15)',
                  color: exitCode === 0 ? '#4ade80' : '#f87171',
                }}
              />
            )}
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider />

        {/* Output body */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: 2,
            py: 1,
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: 14,
            color: '#dcdcdc',
            lineHeight: 1.6,
          }}
        >
          {waiting && (
            <Box sx={{ color: '#555', fontStyle: 'italic' }}>Waiting for run...</Box>
          )}
          {lines.map((line, i) => (
            <Box key={i} component="div">{line || '\u00A0'}</Box>
          ))}
          {result?.error && (
            <Box sx={{ color: '#f87171', mt: 1 }}>{result.error}</Box>
          )}
          <div ref={bottomRef} />
        </Box>
      </Box>
    </Box>
  )
}
