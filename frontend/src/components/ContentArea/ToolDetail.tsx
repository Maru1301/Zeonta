import { useState } from 'react'
import { Box, Typography, Chip, Button, Divider, IconButton } from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import { DeleteTool } from '../../../wailsjs/go/main/App'
import type { Tool } from '../../types/tool'

interface Props {
  tool: Tool
  onEdit: () => void
  onRun: () => void
  onDeleted: () => void
}

export default function ToolDetail({ tool, onEdit, onRun, onDeleted }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    try {
      await DeleteTool(tool.id)
      onDeleted()
    } catch (e: any) {
      setError(String(e))
    }
  }

  return (
    <Box sx={{ p: 3, maxWidth: 720 }}>
      {/* Header */}
      <Box className="flex items-center justify-between gap-2" sx={{ mb: 2 }}>
        <Box className="flex items-center gap-2">
          <Typography variant="h6" sx={{ fontWeight: 600 }}>{tool.name}</Typography>
          <Chip
            label={tool.type}
            size="small"
            sx={{
              bgcolor: tool.type === 'shell' ? 'rgba(34,197,94,0.15)' : 'rgba(99,179,237,0.15)',
              color: tool.type === 'shell' ? '#4ade80' : '#63b3ed',
            }}
          />
        </Box>

        <Box className="flex gap-1">
          <Button size="small" variant="contained" startIcon={<PlayArrowIcon />} onClick={onRun}>
            Run
          </Button>
          <IconButton size="small" onClick={onEdit} sx={{ color: 'text.secondary' }}>
            <EditIcon fontSize="small" />
          </IconButton>
          {!confirming ? (
            <IconButton size="small" onClick={() => setConfirming(true)} sx={{ color: 'text.secondary' }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          ) : (
            <Box className="flex items-center gap-1" sx={{ ml: 1 }}>
              <Typography variant="caption" sx={{ color: '#f87171' }}>Delete?</Typography>
              <IconButton size="small" onClick={handleDelete} sx={{ color: '#4ade80' }}>
                <CheckIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => setConfirming(false)} sx={{ color: 'text.secondary' }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>
      </Box>

      {/* Description */}
      {tool.desc && (
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>{tool.desc}</Typography>
      )}

      {error && (
        <Typography variant="caption" sx={{ color: '#f87171', display: 'block', mb: 1 }}>{error}</Typography>
      )}

      <Divider sx={{ mb: 2 }} />

      {/* Script body */}
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>Script</Typography>
      <Box
        component="pre"
        sx={{
          bgcolor: '#1a1a1a',
          border: '1px solid #3a3a3a',
          borderRadius: 1,
          p: 2,
          overflowX: 'auto',
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontSize: 13,
          color: '#dcdcdc',
          mb: 3,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {tool.body}
      </Box>

      {/* Params */}
      {tool.params.length > 0 && (
        <>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
            Parameters
          </Typography>
          <Box sx={{ mb: 3 }}>
            {tool.params.map(p => (
              <Box key={p.id} className="flex gap-3" sx={{ mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#7c6af7' }}>
                  {`{{${p.name}}}`}
                </Typography>
                {p.default && (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    default: {p.default}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </>
      )}

      {/* Env vars */}
      {tool.envVars.length > 0 && (
        <>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
            Environment Variables
          </Typography>
          <Box>
            {tool.envVars.map(e => (
              <Box key={e.id} className="flex gap-3" sx={{ mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#63b3ed' }}>
                  {e.key}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  = {e.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  )
}
