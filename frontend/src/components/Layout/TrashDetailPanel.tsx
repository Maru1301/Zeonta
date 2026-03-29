import { useState, useEffect } from 'react'
import {
  Box, Typography, Chip, Button, Divider, IconButton,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import RestoreIcon from '@mui/icons-material/Restore'
import { ListToolVersions, GetToolVersion, RestoreDeletedTool } from '../../../wailsjs/go/main/App'
import type { ToolVersionSummary, ToolVersion } from '../../types/tool'

interface Props {
  toolId: string
  toolName: string
  onRestored: (toolId: string) => void
  onClose: () => void
}

function formatDate(unixSec: number): string {
  return new Date(unixSec * 1000).toLocaleString()
}

export default function TrashDetailPanel({ toolId, toolName, onRestored, onClose }: Props) {
  const [versions, setVersions] = useState<ToolVersionSummary[]>([])
  const [previewVersion, setPreviewVersion] = useState<ToolVersion | null>(null)
  const [pendingRestore, setPendingRestore] = useState(false)

  useEffect(() => {
    const load = async () => {
      const vlist = await ListToolVersions(toolId).catch(() => [])
      setVersions(vlist ?? [])
      if (vlist && vlist.length > 0) {
        const latest = await GetToolVersion(vlist[0].id).catch(() => null)
        setPreviewVersion(latest)
      }
    }
    load()
  }, [toolId])

  const handleSelectVersion = async (id: string) => {
    const v = await GetToolVersion(id).catch(() => null)
    if (v) setPreviewVersion(v)
  }

  const handleRestoreConfirmed = async () => {
    if (!previewVersion) return
    const tool = await RestoreDeletedTool(previewVersion.id)
    setPendingRestore(false)
    onRestored(tool.id)
    onClose()
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Box className="flex items-center justify-between" sx={{ px: 3, py: 2, flexShrink: 0 }}>
        <Typography variant="h6" noWrap sx={{ flex: 1, mr: 1 }}>{toolName}</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Divider />

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
            onClick={() => setPendingRestore(true)}
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
                bgcolor: previewVersion?.id === v.id ? 'action.hover' : 'transparent',
                '&:hover': { bgcolor: 'action.hover' },
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

      <Dialog open={pendingRestore} onClose={() => setPendingRestore(false)}>
        <DialogTitle>Restore "{toolName}"?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will add the tool back to your tools list. You can delete it again at any time.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingRestore(false)}>Cancel</Button>
          <Button onClick={handleRestoreConfirmed} variant="contained">Restore</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
