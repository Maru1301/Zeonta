import { useState } from 'react'
import { Box, Typography, Chip, Button, Divider, IconButton, TextField } from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import HistoryEduIcon from '@mui/icons-material/HistoryEdu'
import { DeleteTool } from '../../../wailsjs/go/main/App'
import type { Tool } from '../../types/tool'

interface Props {
  tool: Tool
  onEdit: () => void
  onRun: (paramValues: Record<string, string>) => void
  onDeleted: () => void
  onVersions: () => void
}

export default function ToolDetail({ tool, onEdit, onRun, onDeleted, onVersions }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [paramValues, setParamValues] = useState<Record<string, string>>(() => {
    const pv: Record<string, string> = {}
    ;(tool.params ?? []).forEach(p => { pv[p.name] = p.default })
    return pv
  })

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
      <Box className="flex items-center justify-between gap-2" sx={{ mb: 2.5 }}>
        <Box className="flex items-center gap-2">
          <Typography variant="h6">{tool.name}</Typography>
          <Chip
            label={tool.type}
            size="small"
            sx={{
              bgcolor: tool.type === 'shell' ? 'rgba(34,197,94,0.15)' : 'rgba(99,179,237,0.15)',
              color: tool.type === 'shell' ? '#4ade80' : '#63b3ed',
            }}
          />
        </Box>

        <Box className="flex gap-1 items-center">
          <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={() => onRun(paramValues)}>
            Run
          </Button>
          <IconButton onClick={onVersions} title="Version history" sx={{ color: 'text.secondary' }}>
            <HistoryEduIcon />
          </IconButton>
          <IconButton onClick={onEdit} sx={{ color: 'text.secondary' }}>
            <EditIcon />
          </IconButton>
          {!confirming ? (
            <IconButton onClick={() => setConfirming(true)} sx={{ color: 'text.secondary' }}>
              <DeleteIcon />
            </IconButton>
          ) : (
            <Box className="flex items-center gap-1" sx={{ ml: 1 }}>
              <Typography variant="body2" sx={{ color: '#f87171' }}>Delete?</Typography>
              <IconButton size="small" onClick={handleDelete} sx={{ color: '#4ade80' }}>
                <CheckIcon />
              </IconButton>
              <IconButton size="small" onClick={() => setConfirming(false)} sx={{ color: 'text.secondary' }}>
                <CloseIcon />
              </IconButton>
            </Box>
          )}
        </Box>
      </Box>

      {/* Description */}
      {tool.desc && (
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2.5 }}>{tool.desc}</Typography>
      )}

      {error && (
        <Typography variant="body2" sx={{ color: '#f87171', display: 'block', mb: 1.5 }}>{error}</Typography>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* Script body */}
      <Typography variant="body2" sx={{ color: 'text.secondary', display: 'block', mb: 1.5, fontWeight: 500 }}>Script</Typography>
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

      {/* Params */}
      {(tool.params ?? []).length > 0 && (
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
      )}
    </Box>
  )
}
