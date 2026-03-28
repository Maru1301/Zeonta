import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, IconButton, Divider, Chip, Button, TextField, Checkbox,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Alert,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import RestoreIcon from '@mui/icons-material/Restore'
import DeleteIcon from '@mui/icons-material/Delete'
import { ListDeletedTools, ListToolVersions, GetToolVersion, RestoreDeletedTool, ClearTrashByIDs } from '../../../wailsjs/go/main/App'
import type { DeletedToolSummary, ToolVersionSummary, ToolVersion } from '../../types/tool'

interface Props {
  refreshSignal: number
  onClose: () => void
  onRestored: (toolId: string) => void
  onTrashCleared: () => void
}

function formatDate(unixSec: number): string {
  return new Date(unixSec * 1000).toLocaleString()
}

export default function TrashPanel({ refreshSignal, onClose, onRestored, onTrashCleared }: Props) {
  const [deletedTools, setDeletedTools] = useState<DeletedToolSummary[]>([])
  const [search, setSearch] = useState('')
  const [selectedTool, setSelectedTool] = useState<DeletedToolSummary | null>(null)
  const [versions, setVersions] = useState<ToolVersionSummary[]>([])
  const [previewVersion, setPreviewVersion] = useState<ToolVersion | null>(null)
  const [checkedIDs, setCheckedIDs] = useState<Set<string>>(new Set())
  const [deleteSelectedDialogOpen, setDeleteSelectedDialogOpen] = useState(false)
  const [restoreSelectedDialogOpen, setRestoreSelectedDialogOpen] = useState(false)
  const [pendingRestore, setPendingRestore] = useState<{ versionId: string; toolName: string } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    const list = await ListDeletedTools()
    setDeletedTools(list ?? [])
    setSelectedTool(null)
    setVersions([])
    setPreviewVersion(null)
    setCheckedIDs(new Set())
  }, [])

  useEffect(() => { load() }, [load, refreshSignal])

  const filtered = deletedTools.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  )

  // Select-all state derived from filtered list
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

  const handleSelectTool = async (tool: DeletedToolSummary) => {
    setSelectedTool(tool)
    const vlist = await ListToolVersions(tool.toolId)
    setVersions(vlist ?? [])
    if (vlist && vlist.length > 0) {
      const latest = await GetToolVersion(vlist[0].id)
      setPreviewVersion(latest)
    }
  }

  const handleSelectVersion = async (id: string) => {
    try {
      const v = await GetToolVersion(id)
      setPreviewVersion(v)
    } catch { /* ignore */ }
  }

  const confirmRestore = (versionId: string, toolName: string) => {
    setPendingRestore({ versionId, toolName })
  }

  const handleRestoreConfirmed = async () => {
    if (!pendingRestore) return
    try {
      const tool = await RestoreDeletedTool(pendingRestore.versionId)
      setPendingRestore(null)
      onRestored(tool.id)
      await load()
    } catch (e: any) {
      setPendingRestore(null)
      setErrorMsg(String(e))
    }
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
          {selectedTool && (
            <IconButton size="small" onClick={() => { setSelectedTool(null); setVersions([]); setPreviewVersion(null) }} sx={{ color: 'text.secondary' }}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          )}
          <Typography variant="h6">{selectedTool ? selectedTool.name : 'Trash'}</Typography>
        </Box>
        <Box className="flex items-center gap-1">
          {!selectedTool && checkedIDs.size > 0 && (
            <Button
              size="small"
              startIcon={<RestoreIcon fontSize="small" />}
              onClick={() => setRestoreSelectedDialogOpen(true)}
              sx={{ color: 'text.secondary' }}
            >
              Restore ({checkedIDs.size})
            </Button>
          )}
          {!selectedTool && checkedIDs.size > 0 && (
            <Button
              size="small"
              startIcon={<DeleteIcon fontSize="small" />}
              onClick={() => setDeleteSelectedDialogOpen(true)}
              sx={{ color: '#f87171' }}
            >
              Delete ({checkedIDs.size})
            </Button>
          )}
          <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>
      <Divider />

      {selectedTool ? (
        /* Detail view */
        <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ px: 3, py: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box className="flex items-center gap-2 flex-wrap">
              <Chip
                label={previewVersion?.type ?? ''}
                size="small"
                sx={{
                  bgcolor: previewVersion?.type === 'shell' ? 'rgba(34,197,94,0.15)' : 'rgba(99,179,237,0.15)',
                  color: previewVersion?.type === 'shell' ? '#4ade80' : '#63b3ed',
                }}
              />
              {previewVersion && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Previewing v{previewVersion.version} · {formatDate(previewVersion.savedAt)}
                </Typography>
              )}
            </Box>
            <Button
              size="small"
              variant="outlined"
              startIcon={<RestoreIcon fontSize="small" />}
              onClick={() => previewVersion && confirmRestore(previewVersion.id, selectedTool.name)}
              disabled={!previewVersion}
              sx={{ alignSelf: 'flex-start', borderColor: 'divider', color: 'text.secondary' }}
            >
              Restore this version
            </Button>
          </Box>

          <Divider />

          <Box sx={{ px: 3, py: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1 }}>Script</Typography>
            <Box
              component="pre"
              sx={{
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
                minHeight: 80,
              }}
            >
              {previewVersion?.body ?? ''}
            </Box>
          </Box>

          <Divider />

          <Box>
            <Typography variant="body2" sx={{ px: 3, py: 1.5, color: 'text.secondary', fontWeight: 500 }}>
              All versions
            </Typography>
            {versions.map((v, idx) => (
              <Box
                key={v.id}
                onClick={() => handleSelectVersion(v.id)}
                className="flex items-center gap-3"
                sx={{
                  px: 3, py: 1.25,
                  cursor: 'pointer',
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  bgcolor: previewVersion?.id === v.id ? 'rgba(255,255,255,0.04)' : 'transparent',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 32 }}>v{v.version}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', flex: 1 }}>
                  {formatDate(v.savedAt)}
                </Typography>
                {idx === 0 && (
                  <Chip label="latest" size="small" sx={{ bgcolor: 'rgba(124,106,247,0.15)', color: '#7c6af7' }} />
                )}
              </Box>
            ))}
          </Box>
        </Box>
      ) : (
        /* List view */
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

          {/* Select-all row — only shown when there are items */}
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
                    onClick={() => handleSelectTool(d)}
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
      )}

      {errorMsg && (
        <Alert severity="error" onClose={() => setErrorMsg(null)} sx={{ mx: 3, mb: 1 }}>
          {errorMsg}
        </Alert>
      )}

      {/* Restore confirmation */}
      <Dialog open={pendingRestore !== null} onClose={() => setPendingRestore(null)}>
        <DialogTitle>Restore "{pendingRestore?.toolName}"?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will add the tool back to your tools list. You can delete it again at any time.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingRestore(null)}>Cancel</Button>
          <Button onClick={handleRestoreConfirmed} variant="contained">Restore</Button>
        </DialogActions>
      </Dialog>

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
