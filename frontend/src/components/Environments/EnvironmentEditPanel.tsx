import { useState, useEffect } from 'react'
import {
  Box, Typography, IconButton, Button, Divider, TextField,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  GetEnvironment, CreateEnvironment, UpdateEnvironment,
} from '../../../wailsjs/go/main/App'
import type { Environment, EnvEntry } from '../../types/tool'

interface Props {
  environmentId?: string   // undefined = create, set = edit
  onSaved: () => void
  onClose: () => void
}

export default function EnvironmentEditPanel({ environmentId, onSaved, onClose }: Props) {
  const [editing, setEditing] = useState<Environment | null>(null)
  const [name, setName] = useState('')
  const [entries, setEntries] = useState<EnvEntry[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!environmentId) {
      setEditing(null)
      setName('')
      setEntries([])
      setError('')
      return
    }
    GetEnvironment(environmentId)
      .then(env => {
        setEditing(env)
        setName(env.name)
        setEntries(env.entries ?? [])
        setError('')
      })
      .catch(e => setError(String(e)))
  }, [environmentId])

  const handleSave = async () => {
    try {
      if (editing) {
        await UpdateEnvironment({ ...editing, name, entries } as any)
      } else {
        await CreateEnvironment({ id: '', name, isActive: false, entries } as any)
      }
      onSaved()
      onClose()
    } catch (e: any) {
      setError(String(e))
    }
  }

  const addEntry = () =>
    setEntries(prev => [...prev, { id: '', key: '', value: '', sortOrder: prev.length }])
  const removeEntry = (i: number) =>
    setEntries(prev => prev.filter((_, idx) => idx !== i))
  const updateEntry = (i: number, field: 'key' | 'value', value: string) =>
    setEntries(prev => { const next = [...prev]; next[i] = { ...next[i], [field]: value }; return next })

  const title = editing ? `Edit: ${editing.name}` : 'New Environment'

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Box className="flex items-center justify-between" sx={{ px: 3, py: 2, flexShrink: 0 }}>
        <Typography variant="h6" noWrap sx={{ flex: 1, mr: 1 }}>{title}</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Divider />

      <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {error && (
          <Typography variant="caption" sx={{ color: '#f87171', display: 'block' }}>{error}</Typography>
        )}

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

        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={addEntry}
          sx={{ color: 'text.secondary', alignSelf: 'flex-start' }}
        >
          Add entry
        </Button>
      </Box>

      <Divider />
      <Box className="flex justify-end gap-2" sx={{ px: 3, py: 1.5, flexShrink: 0 }}>
        <Button size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
        <Button size="small" variant="contained" onClick={handleSave}>Save</Button>
      </Box>
    </Box>
  )
}
