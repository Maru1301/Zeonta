import { useState, useEffect } from 'react'
import { Box, Typography, Chip, Divider } from '@mui/material'
import { GetHistoryEntry } from '../../../wailsjs/go/main/App'
import type { HistoryEntry } from '../../types/tool'

interface Props {
  entryId: string
  onViewVersion: (toolId: string, versionId: string) => void
  onClose: () => void
}

function formatDate(unixSec: number): string {
  return new Date(unixSec * 1000).toLocaleString()
}

export default function HistoryDetailPanel({ entryId, onViewVersion, onClose }: Props) {
  const [entry, setEntry] = useState<HistoryEntry | null>(null)

  useEffect(() => {
    GetHistoryEntry(entryId).then(entry => {
      setEntry(entry)
      if (entry?.versionId) onViewVersion(entry.toolId, entry.versionId)
    }).catch(() => setEntry(null))
  }, [entryId])

  if (!entry) return null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ px: 3, py: 2, flexShrink: 0 }}>
        <Typography variant="h6">Run Detail</Typography>
      </Box>
      <Divider />

      <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box className="flex items-center gap-2" sx={{ flexWrap: 'wrap' }}>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>{entry.toolName}</Typography>
          <Chip
            label={entry.exitCode === 0 ? 'exit 0' : `exit ${entry.exitCode}`}
            size="small"
            sx={{
              bgcolor: entry.exitCode === 0 ? 'rgba(34,197,94,0.15)' : 'rgba(248,113,113,0.15)',
              color: entry.exitCode === 0 ? '#4ade80' : '#f87171',
            }}
          />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>{formatDate(entry.ranAt)}</Typography>
        </Box>


        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Output</Typography>
        <Box
          component="pre"
          sx={{
            flex: 1,
            bgcolor: '#111',
            border: '1px solid #3a3a3a',
            borderRadius: 1,
            p: 2,
            overflowX: 'auto',
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: 13,
            color: '#dcdcdc',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            minHeight: 120,
          }}
        >
          {entry.output || '(no output)'}
        </Box>

        {entry.error && (
          <Typography variant="body2" sx={{ color: '#f87171' }}>{entry.error}</Typography>
        )}
      </Box>
    </Box>
  )
}
