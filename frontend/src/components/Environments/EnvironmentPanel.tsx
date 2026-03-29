import { useState, useEffect } from 'react'
import {
  Box, Typography, IconButton, Button, Divider,
  List, ListItemButton, ListItemText, Chip,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  ListEnvironments, DeleteEnvironment, SetActiveEnvironment
} from '../../../wailsjs/go/main/App'
import type { EnvironmentSummary } from '../../types/tool'

interface Props {
  refreshSignal: number
  onNew: () => void
  onEdit: (id: string) => void
  onActiveChanged: () => void
}

export default function EnvironmentPanel({ refreshSignal, onNew, onEdit, onActiveChanged }: Props) {
  const [summaries, setSummaries] = useState<EnvironmentSummary[]>([])
  const [deleteTarget, setDeleteTarget] = useState<EnvironmentSummary | null>(null)
  const [error, setError] = useState('')

  const refresh = async () => {
    const list = await ListEnvironments()
    setSummaries(list ?? [])
  }

  useEffect(() => { refresh() }, [refreshSignal])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await DeleteEnvironment(deleteTarget.id)
      setDeleteTarget(null)
      await refresh()
      onActiveChanged()
    } catch (e: any) {
      setError(String(e))
    }
  }

  const handleSetActive = async (id: string, isActive: boolean) => {
    try {
      await SetActiveEnvironment(isActive ? '' : id)
      await refresh()
      onActiveChanged()
    } catch (e: any) {
      setError(String(e))
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Box className="flex items-center justify-between" sx={{ px: 2, py: 1.5, flexShrink: 0 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Environments</Typography>
      </Box>
      <Divider />

      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {error && (
          <Typography variant="caption" sx={{ color: '#f87171', display: 'block', mb: 1 }}>{error}</Typography>
        )}

        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={onNew}
          sx={{ color: 'text.secondary', mb: 1 }}
        >
          New Environment
        </Button>

        <List dense disablePadding>
          {summaries.map(env => (
            <ListItemButton
              key={env.id}
              disableRipple
              sx={{
                borderRadius: 1,
                mb: 0.5,
                border: '1px solid',
                borderColor: env.isActive ? 'rgba(124,106,247,0.4)' : 'transparent',
                bgcolor: env.isActive ? 'rgba(124,106,247,0.08)' : 'transparent',
              }}
            >
              <ListItemText
                primary={
                  <Box className="flex items-center gap-1">
                    <Typography variant="body2">{env.name}</Typography>
                    {env.isActive && (
                      <Chip label="active" size="small" sx={{ height: 16, fontSize: 10, bgcolor: 'rgba(124,106,247,0.2)', color: '#7c6af7' }} />
                    )}
                  </Box>
                }
              />
              <Box className="flex gap-1">
                <Button
                  size="small"
                  sx={{ fontSize: 11, color: env.isActive ? '#7c6af7' : 'text.secondary', minWidth: 0, px: 1 }}
                  onClick={() => handleSetActive(env.id, env.isActive)}
                >
                  {env.isActive ? 'Deactivate' : 'Set Active'}
                </Button>
                <IconButton size="small" onClick={() => onEdit(env.id)} sx={{ color: 'text.secondary' }}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => setDeleteTarget(env)} sx={{ color: 'text.secondary' }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </ListItemButton>
          ))}
          {summaries.length === 0 && (
            <Typography variant="caption" sx={{ color: '#555', display: 'block', py: 1 }}>
              No environments yet.
            </Typography>
          )}
        </List>
      </Box>

      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete "{deleteTarget?.name}"?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete the environment. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
