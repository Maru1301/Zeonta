import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Divider, Button, TextField, Checkbox,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Alert,
} from '@mui/material'
import RestoreIcon from '@mui/icons-material/Restore'
import DeleteIcon from '@mui/icons-material/Delete'
import { ListDeletedTools, ListToolVersions, RestoreDeletedTool, ClearTrashByIDs } from '../../../wailsjs/go/main/App'
import type { DeletedToolSummary } from '../../types/tool'

interface Props {
  refreshSignal: number
  onRestored: (toolId: string) => void
  onTrashCleared: () => void
  onSelectTool: (toolId: string, toolName: string) => void
}

function formatDate(unixSec: number): string {
  return new Date(unixSec * 1000).toLocaleString()
}

export default function TrashPanel({ refreshSignal, onRestored, onTrashCleared, onSelectTool }: Props) {
  const [deletedTools, setDeletedTools] = useState<DeletedToolSummary[]>([])
  const [search, setSearch] = useState('')
  const [checkedIDs, setCheckedIDs] = useState<Set<string>>(new Set())
  const [deleteSelectedDialogOpen, setDeleteSelectedDialogOpen] = useState(false)
  const [restoreSelectedDialogOpen, setRestoreSelectedDialogOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    const list = await ListDeletedTools()
    setDeletedTools(list ?? [])
    setCheckedIDs(new Set())
  }, [])

  useEffect(() => { load() }, [load, refreshSignal])

  const filtered = deletedTools.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  )

  const allChecked = filtered.length > 0 && filtered.every(d => checkedIDs.has(d.toolId))
  const someChecked = filtered.some(d => checkedIDs.has(d.toolId))

  const toggleSelectAll = () => {
    if (allChecked) {
      setCheckedIDs(prev => {
        const next = new Set(prev)
        filtered.forEach(d => next.delete(d.toolId))
        return next
      })
    } else {
      setCheckedIDs(prev => {
        const next = new Set(prev)
        filtered.forEach(d => next.add(d.toolId))
        return next
      })
    }
  }

  const toggleCheck = (toolId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setCheckedIDs(prev => {
      const next = new Set(prev)
      next.has(toolId) ? next.delete(toolId) : next.add(toolId)
      return next
    })
  }

  const handleDeleteSelected = async () => {
    try {
      await ClearTrashByIDs(Array.from(checkedIDs))
      setDeleteSelectedDialogOpen(false)
      onTrashCleared()
      await load()
    } catch (e: any) {
      setDeleteSelectedDialogOpen(false)
      setErrorMsg(String(e))
    }
  }

  const handleRestoreSelected = async () => {
    setRestoreSelectedDialogOpen(false)
    const errors: string[] = []
    for (const toolId of checkedIDs) {
      try {
        const vlist = await ListToolVersions(toolId)
        if (vlist && vlist.length > 0) {
          const tool = await RestoreDeletedTool(vlist[0].id)
          onRestored(tool.id)
        }
      } catch (e: any) {
        errors.push(String(e))
      }
    }
    if (errors.length > 0) setErrorMsg(errors[0])
    await load()
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Box className="flex items-center justify-between" sx={{ px: 3, py: 2, flexShrink: 0 }}>
        <Typography variant="h6">Trash</Typography>
        <Box className="flex items-center gap-1">
          {checkedIDs.size > 0 && (
            <Button
              size="small"
              startIcon={<RestoreIcon fontSize="small" />}
              onClick={() => setRestoreSelectedDialogOpen(true)}
              sx={{ color: 'text.secondary' }}
            >
              Restore ({checkedIDs.size})
            </Button>
          )}
          {checkedIDs.size > 0 && (
            <Button
              size="small"
              startIcon={<DeleteIcon fontSize="small" />}
              onClick={() => setDeleteSelectedDialogOpen(true)}
              sx={{ color: '#f87171' }}
            >
              Delete ({checkedIDs.size})
            </Button>
          )}
        </Box>
      </Box>
      <Divider />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Search bar */}
        <Box sx={{ px: 3, py: 1.5, flexShrink: 0 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search deleted tools…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </Box>

        {/* Select-all row */}
        {filtered.length > 0 && (
          <Box
            className="flex items-center"
            sx={{ px: 1.5, py: 0.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'rgba(255,255,255,0.02)' }}
          >
            <Checkbox
              size="small"
              checked={allChecked}
              indeterminate={someChecked && !allChecked}
              onChange={toggleSelectAll}
              sx={{ color: 'text.disabled', '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: '#f87171' } }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {someChecked
                ? `${checkedIDs.size} of ${filtered.length} selected`
                : `Select all (${filtered.length})`}
            </Typography>
          </Box>
        )}

        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <Typography variant="body2" sx={{ px: 3, py: 3, color: '#555' }}>
              {deletedTools.length === 0 ? 'Trash is empty.' : 'No tools match your search.'}
            </Typography>
          ) : (
            filtered.map(d => (
              <Box
                key={d.toolId}
                className="flex items-center gap-2"
                sx={{
                  px: 1.5, py: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: checkedIDs.has(d.toolId) ? 'rgba(248,113,113,0.06)' : 'transparent',
                }}
              >
                <Checkbox
                  size="small"
                  checked={checkedIDs.has(d.toolId)}
                  onClick={e => toggleCheck(d.toolId, e)}
                  sx={{ color: 'text.disabled', '&.Mui-checked': { color: '#f87171' } }}
                />
                <Box
                  sx={{ flex: 1, minWidth: 0, cursor: 'pointer', py: 0.5 }}
                  onClick={() => onSelectTool(d.toolId, d.name)}
                >
                  <Typography variant="body2" noWrap>{d.name}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {d.versionCount} version{d.versionCount !== 1 ? 's' : ''} · {formatDate(d.lastSavedAt)}
                  </Typography>
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Box>

      {errorMsg && (
        <Alert severity="error" onClose={() => setErrorMsg(null)} sx={{ mx: 3, mb: 1 }}>
          {errorMsg}
        </Alert>
      )}

      {/* Restore selected confirmation */}
      <Dialog open={restoreSelectedDialogOpen} onClose={() => setRestoreSelectedDialogOpen(false)}>
        <DialogTitle>Restore {checkedIDs.size} tool{checkedIDs.size !== 1 ? 's' : ''}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The selected {checkedIDs.size} tool{checkedIDs.size !== 1 ? 's' : ''} will be added back to your tools list.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreSelectedDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRestoreSelected} variant="contained">Restore</Button>
        </DialogActions>
      </Dialog>

      {/* Delete selected confirmation */}
      <Dialog open={deleteSelectedDialogOpen} onClose={() => setDeleteSelectedDialogOpen(false)}>
        <DialogTitle>Delete {checkedIDs.size} item{checkedIDs.size !== 1 ? 's' : ''}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete the selected {checkedIDs.size} tool{checkedIDs.size !== 1 ? 's' : ''}, their version history, and all associated run history. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteSelectedDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteSelected} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
