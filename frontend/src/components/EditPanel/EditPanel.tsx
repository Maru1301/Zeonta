import { useState, useEffect } from 'react'
import {
  Box, Typography, TextField, Select, MenuItem, Button,
  IconButton, Divider, FormControl, InputLabel
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { CreateTool, UpdateTool } from '../../../wailsjs/go/main/App'
import type { Tool, Param, ToolType } from '../../types/tool'
import type { EditPanelMode } from '../../App'
import ParamEditor from './ParamEditor'

interface Props {
  mode: EditPanelMode
  tool: Tool | null
  onSaved: (id: string) => void
  onClose: () => void
}

export default function EditPanel({ mode, tool, onSaved, onClose }: Props) {
  const [name, setName] = useState('')
  const [type, setType] = useState<ToolType>('shell')
  const [body, setBody] = useState('')
  const [desc, setDesc] = useState('')
  const [params, setParams] = useState<Param[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (mode === 'create') {
      setName(''); setType('shell'); setBody(''); setDesc(''); setParams([])
    } else if (tool && mode === 'edit') {
      setName(tool.name); setType(tool.type as ToolType); setBody(tool.body); setDesc(tool.desc)
      setParams(tool.params)
    }
    setError('')
  }, [mode, tool])

  const handleSave = async () => {
    try {
      if (mode === 'create') {
        const created = await CreateTool({ id: '', name, type, body, desc, params, createdAt: 0 } as any)
        onSaved(created.id)
      } else if (mode === 'edit' && tool) {
        const updated = await UpdateTool({ ...tool, name, type, body, desc, params } as any)
        onSaved(updated.id)
      }
    } catch (e: any) {
      setError(String(e))
    }
  }

  const title = mode === 'create' ? 'New Tool' : `Edit: ${tool?.name}`

  return (
    <Box
      sx={{
        width: 500,
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
        <Typography variant="h6">{title}</Typography>
        <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />

      {/* Body */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {error && (
          <Typography variant="body2" sx={{ color: '#f87171' }}>{error}</Typography>
        )}

        <TextField
          label="Name"
          fullWidth
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <TextField
          label="Description"
          fullWidth
          value={desc}
          onChange={e => setDesc(e.target.value)}
          inputProps={{ maxLength: 300 }}
          helperText={`${desc.length}/300`}
        />
        <FormControl fullWidth>
          <InputLabel>Type</InputLabel>
          <Select value={type} label="Type" onChange={e => setType(e.target.value as ToolType)}>
            <MenuItem value="shell">Shell (PowerShell)</MenuItem>
            <MenuItem value="go">Go</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Script / Function body"
          multiline
          minRows={10}
          fullWidth
          value={body}
          onChange={e => setBody(e.target.value)}
          inputProps={{ style: { fontFamily: '"JetBrains Mono", "Fira Code", monospace', fontSize: 14, lineHeight: 1.65 } }}
        />
        <ParamEditor params={params} onChange={setParams} />
      </Box>

      <Divider />

      {/* Footer */}
      <Box className="flex justify-end gap-2" sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>Save</Button>
      </Box>
    </Box>
  )
}
