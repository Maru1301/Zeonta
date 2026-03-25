import { useState, useEffect } from 'react'
import {
  Box, Typography, IconButton, Button, Divider,
  TextField, List, ListItemButton, ListItemText, Chip
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckIcon from '@mui/icons-material/Check'
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import {
  ListEnvironments, GetEnvironment, CreateEnvironment,
  UpdateEnvironment, DeleteEnvironment, SetActiveEnvironment
} from '../../../wailsjs/go/main/App'
import type { Environment, EnvironmentSummary, EnvEntry } from '../../types/tool'

interface Props {
  onClose: () => void
  onActiveChanged: () => void
}

type PanelMode = 'list' | 'edit'

export default function EnvironmentPanel({ onClose, onActiveChanged }: Props) {
  const [mode, setMode] = useState<PanelMode>('list')
  const [summaries, setSummaries] = useState<EnvironmentSummary[]>([])
  const [editing, setEditing] = useState<Environment | null>(null)
  const [name, setName] = useState('')
  const [entries, setEntries] = useState<EnvEntry[]>([])
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const refresh = async () => {
    const list = await ListEnvironments()
    setSummaries(list ?? [])
  }

  useEffect(() => { refresh() }, [])

  const openCreate = () => {
    setEditing(null)
    setName('')
    setEntries([])
    setError('')
    setMode('edit')
  }

  const openEdit = async (id: string) => {
    try {
      const env = await GetEnvironment(id)
      setEditing(env)
      setName(env.name)
      setEntries(env.entries ?? [])
      setError('')
      setMode('edit')
    } catch (e: any) {
      setError(String(e))
    }
  }

  const handleSave = async () => {
    try {
      if (editing) {
        await UpdateEnvironment({ ...editing, name, entries } as any)
      } else {
        await CreateEnvironment({ id: '', name, isActive: false, entries } as any)
      }
      await refresh()
      setMode('list')
    } catch (e: any) {
      setError(String(e))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await DeleteEnvironment(id)
      setConfirmDeleteId(null)
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

  const addEntry = () => setEntries(prev => [...prev, { id: '', key: '', value: '', sortOrder: prev.length }])
  const removeEntry = (i: number) => setEntries(prev => prev.filter((_, idx) => idx !== i))
  const updateEntry = (i: number, field: 'key' | 'value', value: string) => {
    setEntries(prev => { const next = [...prev]; next[i] = { ...next[i], [field]: value }; return next })
  }

  return (
    <Box
      sx={{
        width: 420,
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
      <Box className="flex items-center justify-between" sx={{ px: 2, py: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {mode === 'list' ? 'Environments' : editing ? `Edit: ${editing.name}` : 'New Environment'}
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Divider />

      {/* Body */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {error && (
          <Typography variant="caption" sx={{ color: '#f87171', display: 'block', mb: 1 }}>{error}</Typography>
        )}

        {mode === 'list' && (
          <>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={openCreate}
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
                    <IconButton size="small" onClick={() => openEdit(env.id)} sx={{ color: 'text.secondary' }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    {confirmDeleteId !== env.id ? (
                      <IconButton size="small" onClick={() => setConfirmDeleteId(env.id)} sx={{ color: 'text.secondary' }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    ) : (
                      <Box className="flex items-center gap-1">
                        <Typography variant="caption" sx={{ color: '#f87171' }}>Delete?</Typography>
                        <IconButton size="small" onClick={() => handleDelete(env.id)} sx={{ color: '#4ade80' }}>
                          <CheckIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => setConfirmDeleteId(null)} sx={{ color: 'text.secondary' }}>
                          <CloseOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                </ListItemButton>
              ))}
              {summaries.length === 0 && (
                <Typography variant="caption" sx={{ color: '#555', display: 'block', py: 1 }}>
                  No environments yet.
                </Typography>
              )}
            </List>
          </>
        )}

        {mode === 'edit' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              size="small"
              fullWidth
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Key-Value Pairs</Typography>
            {entries.map((e, i) => (
              <Box key={i} className="flex gap-2 items-center">
                <TextField
                  size="small"
                  placeholder="KEY"
                  value={e.key}
                  onChange={ev => updateEntry(i, 'key', ev.target.value)}
                  sx={{ flex: 1, fontFamily: 'monospace' }}
                />
                <TextField
                  size="small"
                  placeholder="value"
                  value={e.value}
                  onChange={ev => updateEntry(i, 'value', ev.target.value)}
                  sx={{ flex: 1 }}
                />
                <IconButton size="small" onClick={() => removeEntry(i)} sx={{ color: 'text.secondary' }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <Button size="small" startIcon={<AddIcon />} onClick={addEntry} sx={{ color: 'text.secondary', alignSelf: 'flex-start' }}>
              Add entry
            </Button>
          </Box>
        )}
      </Box>

      <Divider />

      {/* Footer */}
      <Box className="flex justify-end gap-2" sx={{ px: 2, py: 1.5 }}>
        {mode === 'list' ? (
          <Button size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>Close</Button>
        ) : (
          <>
            <Button size="small" onClick={() => setMode('list')} sx={{ color: 'text.secondary' }}>Cancel</Button>
            <Button size="small" variant="contained" onClick={handleSave}>Save</Button>
          </>
        )}
      </Box>
    </Box>
  )
}
