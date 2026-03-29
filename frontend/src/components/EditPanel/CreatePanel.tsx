import { useState } from 'react'
import {
  Box, Typography, TextField, Select, MenuItem, Button,
  Divider, FormControl, InputLabel,
} from '@mui/material'
import { CreateTool } from '../../../wailsjs/go/main/App'
import type { Param, ToolType } from '../../types/tool'
import ParamEditor from './ParamEditor'

interface Props {
  onSaved: (id: string) => void
  onClose: () => void
}

export default function CreatePanel({ onSaved, onClose }: Props) {
  const [name, setName] = useState('')
  const [type, setType] = useState<ToolType>('shell')
  const [body, setBody] = useState('')
  const [desc, setDesc] = useState('')
  const [params, setParams] = useState<Param[]>([])
  const [error, setError] = useState('')

  const handleSave = async () => {
    try {
      const created = await CreateTool({ id: '', name, type, body, desc, params, createdAt: 0 } as any)
      onSaved(created.id)
    } catch (e: any) {
      setError(String(e))
    }
  }

  return (
    <Box sx={{ p: 4, maxWidth: 860 }}>
      {/* Header */}
      <Box sx={{ mb: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <TextField
          value={name}
          onChange={e => setName(e.target.value)}
          size="small"
          fullWidth
          placeholder="Tool name"
          autoFocus
        />
        <FormControl size="small" sx={{ width: 220 }}>
          <InputLabel>Type</InputLabel>
          <Select value={type} label="Type" onChange={e => setType(e.target.value as ToolType)}>
            <MenuItem value="shell">Shell (PowerShell)</MenuItem>
            <MenuItem value="go">Go</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Description */}
      <TextField
        label="Description"
        fullWidth
        value={desc}
        onChange={e => setDesc(e.target.value)}
        slotProps={{ htmlInput: { maxLength: 300 } }}
        helperText={`${desc.length}/300`}
        sx={{ mb: 2.5 }}
      />

      {error && (
        <Typography variant="body2" sx={{ color: '#f87171', mb: 1.5 }}>{error}</Typography>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* Script body */}
      <Typography variant="body2" sx={{ color: 'text.secondary', display: 'block', mb: 1.5, fontWeight: 500 }}>Script</Typography>
      <TextField
        multiline
        minRows={10}
        fullWidth
        value={body}
        onChange={e => setBody(e.target.value)}
        slotProps={{ htmlInput: { style: { fontFamily: '"JetBrains Mono", "Fira Code", monospace', fontSize: 14, lineHeight: 1.65 } } }}
        sx={{ mb: 4 }}
      />

      {/* Params */}
      <ParamEditor params={params} onChange={setParams} />

      <Box className="flex justify-end gap-1" sx={{ mt: 4 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>Save</Button>
      </Box>
    </Box>
  )
}
