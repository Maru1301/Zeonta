import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, IconButton, Divider, Chip, Button,
  Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import HistoryEduIcon from '@mui/icons-material/HistoryEdu'
import { ListHistory, GetHistoryEntry, ClearHistory } from '../../../wailsjs/go/main/App'
import type { HistorySummary, HistoryEntry, ToolSummary } from '../../types/tool'

interface Props {
  tools: ToolSummary[]
  runCount: number
  onClose: () => void
  onViewVersion: (toolId: string, versionId: string) => void
}

function formatDate(unixSec: number): string {
  return new Date(unixSec * 1000).toLocaleString()
}

export default function HistoryPanel({ tools, runCount, onClose, onViewVersion }: Props) {
  const [filterToolId, setFilterToolId] = useState('')
  const [summaries, setSummaries] = useState<HistorySummary[]>([])
  const [selected, setSelected] = useState<HistoryEntry | null>(null)
  const [clearDialogOpen, setClearDialogOpen] = useState(false)

  const load = useCallback(async () => {
    const list = await ListHistory(filterToolId)
    setSummaries(list ?? [])
    setSelected(null)
  }, [filterToolId])

  useEffect(() => { load() }, [load, runCount])

  const handleSelect = async (id: string) => {
    try {
      const entry = await GetHistoryEntry(id)
      setSelected(entry)
    } catch {
      // entry may have been cleared
    }
  }

  const handleClear = async () => {
    await ClearHistory(filterToolId)
    setClearDialogOpen(false)
    await load()
  }

  return (
    <Box
      sx={{
        width: 560,
        flexShrink: 0,
        bgcolor: 'background.paper',
        borderLeft: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box className="flex items-center justify-between" sx={{ px: 3, py: 2 }}>
        <Box className="flex items-center gap-2">
          {selected && (
            <IconButton size="small" onClick={() => setSelected(null)} sx={{ color: 'text.secondary' }}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          )}
          <Typography variant="h6">{selected ? 'Run Detail' : 'History'}</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />

      {selected ? (
        /* Detail view */
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box className="flex items-center gap-2" sx={{ flexWrap: 'wrap' }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{selected.toolName}</Typography>
            <Chip
              label={selected.exitCode === 0 ? 'exit 0' : `exit ${selected.exitCode}`}
              size="small"
              sx={{
                bgcolor: selected.exitCode === 0 ? 'rgba(34,197,94,0.15)' : 'rgba(248,113,113,0.15)',
                color: selected.exitCode === 0 ? '#4ade80' : '#f87171',
              }}
            />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{formatDate(selected.ranAt)}</Typography>
          </Box>

          {selected.versionId && (
            <Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={<HistoryEduIcon fontSize="small" />}
                onClick={() => onViewVersion(selected.toolId, selected.versionId)}
                sx={{ borderColor: 'divider', color: 'text.secondary' }}
              >
                View version
              </Button>
            </Box>
          )}

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
            {selected.output || '(no output)'}
          </Box>

          {selected.error && (
            <Typography variant="body2" sx={{ color: '#f87171' }}>{selected.error}</Typography>
          )}
        </Box>
      ) : (
        /* List view */
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Filter + Clear bar */}
          <Box className="flex items-center gap-2" sx={{ px: 3, py: 1.5, flexShrink: 0 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel>Filter by tool</InputLabel>
              <Select
                value={filterToolId}
                label="Filter by tool"
                onChange={e => setFilterToolId(e.target.value)}
              >
                <MenuItem value="">All tools</MenuItem>
                {tools.map(t => (
                  <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              size="small"
              startIcon={<DeleteSweepIcon fontSize="small" />}
              onClick={() => setClearDialogOpen(true)}
              disabled={summaries.length === 0}
              sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}
            >
              Clear
            </Button>
          </Box>
          <Divider />

          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {summaries.length === 0 ? (
              <Typography variant="body2" sx={{ px: 3, py: 3, color: '#555' }}>
                No history yet. Run a tool to see results here.
              </Typography>
            ) : (
              summaries.map(h => (
                <Box
                  key={h.id}
                  onClick={() => handleSelect(h.id)}
                  className="flex items-center gap-2"
                  sx={{
                    px: 3, py: 1.5,
                    cursor: 'pointer',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                  }}
                >
                  <Chip
                    label={h.exitCode === 0 ? '0' : String(h.exitCode)}
                    size="small"
                    sx={{
                      minWidth: 32,
                      bgcolor: h.exitCode === 0 ? 'rgba(34,197,94,0.15)' : 'rgba(248,113,113,0.15)',
                      color: h.exitCode === 0 ? '#4ade80' : '#f87171',
                    }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap>{h.toolName}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {formatDate(h.ranAt)}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Box>
      )}

      <Dialog open={clearDialogOpen} onClose={() => setClearDialogOpen(false)}>
        <DialogTitle>Clear history?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {filterToolId
              ? `This will permanently delete all history for the selected tool.`
              : `This will permanently delete all run history across every tool.`}
            {' '}This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleClear} color="error" variant="contained">Clear</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
