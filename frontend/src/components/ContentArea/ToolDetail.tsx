import { useState, useEffect } from 'react'
import {
  Box, Typography, Chip, Button, Divider, IconButton, Tooltip,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { DeleteTool, UpdateTool } from '../../../wailsjs/go/main/App'
import type { Tool, Param, ToolType, Platform } from '../../types/tool'
import { toolTypeConfig, isTypeAvailable } from '../../types/tool'
import ParamEditor from '../EditPanel/ParamEditor'

interface Props {
  tool: Tool
  onSaved: (id: string) => void
  onRun: (paramValues: Record<string, string>) => void
  onDeleted: () => void
  platform: Platform
}

export default function ToolDetail({ tool, onSaved, onRun, onDeleted, platform }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [error, setError] = useState('')

  // view mode
  const [paramValues, setParamValues] = useState<Record<string, string>>({})

  // edit mode
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState<ToolType>('powershell')
  const [editDesc, setEditDesc] = useState('')
  const [editBody, setEditBody] = useState('')
  const [editParams, setEditParams] = useState<Param[]>([])

  // reset when switching to a different tool
  useEffect(() => {
    setIsEditing(false)
    setDeleteDialogOpen(false)
    setError('')
    const pv: Record<string, string> = {}
    ;(tool.params ?? []).forEach(p => { pv[p.name] = p.default })
    setParamValues(pv)
  }, [tool.id])

  // keep view param values in sync when tool updates (e.g. after save)
  useEffect(() => {
    setParamValues(prev => {
      const pv: Record<string, string> = {}
      ;(tool.params ?? []).forEach(p => { pv[p.name] = prev[p.name] ?? p.default })
      return pv
    })
  }, [tool])

  const startEditing = () => {
    setEditName(tool.name)
    setEditType(tool.type as ToolType)
    setEditDesc(tool.desc)
    setEditBody(tool.body)
    setEditParams(tool.params ?? [])
    setError('')
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setError('')
  }

  const handleSave = async () => {
    try {
      const updated = await UpdateTool({ ...tool, name: editName, type: editType, desc: editDesc, body: editBody, params: editParams } as any)
      setIsEditing(false)
      setError('')
      onSaved(updated.id)
    } catch (e: any) {
      setError(String(e))
    }
  }

  const handleDelete = async () => {
    try {
      await DeleteTool(tool.id)
      onDeleted()
    } catch (e: any) {
      setError(String(e))
    }
  }

  return (
    <Box sx={{ p: 4, maxWidth: 860 }}>
      {/* Header */}
      {isEditing ? (
        <Box sx={{ mb: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField
            value={editName}
            onChange={e => setEditName(e.target.value)}
            size="small"
            fullWidth
            autoFocus
          />
          <FormControl size="small" sx={{ width: 220 }}>
            <InputLabel>Type</InputLabel>
            <Select value={editType} label="Type" onChange={e => setEditType(e.target.value as ToolType)}>
              {(Object.entries(toolTypeConfig) as [ToolType, typeof toolTypeConfig[ToolType]][])
                .filter(([t]) => isTypeAvailable(t, platform))
                .map(([t, cfg]) => (
                  <MenuItem key={t} value={t}>{cfg.label}</MenuItem>
                ))
              }
            </Select>
          </FormControl>
        </Box>
      ) : (
        <Box className="flex items-center justify-between gap-2" sx={{ mb: 2.5 }}>
          <Box className="flex items-center gap-2">
            <Typography variant="h6">{tool.name}</Typography>
            <Chip
              label={toolTypeConfig[tool.type as ToolType]?.label ?? tool.type}
              size="small"
              sx={{
                bgcolor: toolTypeConfig[tool.type as ToolType]?.chipBg ?? 'rgba(99,179,237,0.15)',
                color: toolTypeConfig[tool.type as ToolType]?.chipColor.dark ?? '#63b3ed',
              }}
            />
          </Box>
          <Box className="flex gap-1 items-center" sx={{ flexShrink: 0 }}>
            <Tooltip title={isTypeAvailable(tool.type as ToolType, platform) ? '' : 'Not supported on this platform'}>
              <span>
                <Button
                  variant="contained"
                  startIcon={<PlayArrowIcon />}
                  onClick={() => onRun(paramValues)}
                  disabled={!isTypeAvailable(tool.type as ToolType, platform)}
                >
                  Run
                </Button>
              </span>
            </Tooltip>

            <IconButton onClick={startEditing} sx={{ color: 'text.secondary' }}>
              <EditIcon />
            </IconButton>
            <IconButton onClick={() => setDeleteDialogOpen(true)} sx={{ color: 'text.secondary' }}>
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
      )}

      {/* Description */}
      {isEditing ? (
        <TextField
          label="Description"
          fullWidth
          value={editDesc}
          onChange={e => setEditDesc(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 300 } }}
          helperText={`${editDesc.length}/300`}
          sx={{ mb: 2.5 }}
        />
      ) : (
        tool.desc && (
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2.5 }}>{tool.desc}</Typography>
        )
      )}

      {error && (
        <Typography variant="body2" sx={{ color: '#f87171', display: 'block', mb: 1.5 }}>{error}</Typography>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* Script body */}
      <Typography variant="body2" sx={{ color: 'text.secondary', display: 'block', mb: 1.5, fontWeight: 500 }}>Script</Typography>
      {isEditing ? (
        <TextField
          multiline
          minRows={10}
          fullWidth
          value={editBody}
          onChange={e => setEditBody(e.target.value)}
          slotProps={{ htmlInput: { style: { fontFamily: '"JetBrains Mono", "Fira Code", monospace', fontSize: 14, lineHeight: 1.65 } } }}
          sx={{ mb: 4 }}
        />
      ) : (
        <Box
          component="pre"
          sx={{
            bgcolor: '#1a1a1a',
            border: '1px solid #3a3a3a',
            borderRadius: 1,
            p: 2.5,
            overflowX: 'auto',
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: 14,
            color: '#dcdcdc',
            mb: 4,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            lineHeight: 1.65,
          }}
        >
          {tool.body}
        </Box>
      )}

      {/* Params */}
      {isEditing ? (
        <>
          <ParamEditor params={editParams} onChange={setEditParams} />
          <Box className="flex justify-end gap-1" sx={{ mt: 4 }}>
            <Button onClick={cancelEditing} sx={{ color: 'text.secondary' }}>Cancel</Button>
            <Button variant="contained" onClick={handleSave}>Save</Button>
          </Box>
        </>
      ) : (
        (tool.params ?? []).length > 0 && (
          <>
            <Typography variant="body2" sx={{ color: 'text.secondary', display: 'block', mb: 1.5, fontWeight: 500 }}>
              Parameters
            </Typography>
            <Box sx={{ mb: 3 }}>
              {(tool.params ?? []).map(p => (
                <TextField
                  key={p.id || p.name}
                  label={`[[${p.name}]]`}
                  fullWidth
                  value={paramValues[p.name] ?? p.default}
                  onChange={e => setParamValues(prev => ({ ...prev, [p.name]: e.target.value }))}
                  sx={{ mb: 1.5 }}
                />
              ))}
            </Box>
          </>
        )
      )}

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete "{tool.name}"?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The tool will be moved to Trash. You can restore it from the Trash tab at any time.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
