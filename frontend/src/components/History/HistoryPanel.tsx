import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Divider, Chip, Button,
  Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from '@mui/material'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import { ListHistory, ClearHistory } from '../../../wailsjs/go/main/App'
import type { HistorySummary, ToolSummary } from '../../types/tool'

interface Props {
  tools: ToolSummary[]
  runCount: number
  onSelectEntry: (id: string, toolName: string) => void
}

function formatDate(unixSec: number): string {
  return new Date(unixSec * 1000).toLocaleString()
}

export default function HistoryPanel({ tools, runCount, onSelectEntry }: Props) {
  const [filterToolId, setFilterToolId] = useState('')
  const [summaries, setSummaries] = useState<HistorySummary[]>([])
  const [clearDialogOpen, setClearDialogOpen] = useState(false)

  const load = useCallback(async () => {
    const list = await ListHistory(filterToolId)
    setSummaries(list ?? [])
  }, [filterToolId])

  useEffect(() => { load() }, [load, runCount])

  const handleClear = async () => {
    await ClearHistory(filterToolId)
    setClearDialogOpen(false)
    await load()
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
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
              onClick={() => onSelectEntry(h.id, h.toolName)}
              className="flex items-center gap-2"
              sx={{
                px: 3, py: 1.5,
                cursor: 'pointer',
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:hover': { bgcolor: 'action.hover' },
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
