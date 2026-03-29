import { useState, useEffect } from 'react'
import { Box, Typography, IconButton, Divider, Chip, Button } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import RestoreIcon from '@mui/icons-material/Restore'
import { ListToolVersions, GetToolVersion, RestoreToolVersion, RunToolVersion } from '../../../wailsjs/go/main/App'
import type { Tool, ToolVersionSummary, ToolVersion } from '../../types/tool'

interface Props {
  toolId: string
  liveTool: Tool | null
  saveCount: number
  initialVersionId?: string
  onClose: () => void
  onRestored: (toolId: string) => void
  onRunStart: () => void
}

function formatDate(unixSec: number): string {
  return new Date(unixSec * 1000).toLocaleString()
}

function contentMatchesLive(v: ToolVersion, live: Tool): boolean {
  return v.body === live.body && v.name === live.name && v.type === live.type && v.desc === live.desc
}

export default function VersionPanel({ toolId, liveTool, saveCount, initialVersionId, onClose, onRestored, onRunStart }: Props) {
  const [summaries, setSummaries] = useState<ToolVersionSummary[]>([])
  const [versions, setVersions] = useState<ToolVersion[]>([])
  const [selected, setSelected] = useState<ToolVersion | null>(null)

  useEffect(() => {
    ListToolVersions(toolId).then(async list => {
      const s = list ?? []
      setSummaries(s)
      const full = await Promise.all(s.map(v => GetToolVersion(v.id).catch(() => null)))
      const resolved = full.filter((v): v is ToolVersion => v !== null)
      setVersions(resolved)
      if (initialVersionId) {
        setSelected(resolved.find(v => v.id === initialVersionId) ?? null)
      }
    })
  }, [toolId, saveCount])

  const handleSelect = async (id: string) => {
    try {
      const v = await GetToolVersion(id)
      setSelected(v)
    } catch { /* ignore */ }
  }

  const handleRestore = async () => {
    if (!selected) return
    try {
      const tool = await RestoreToolVersion(selected.id)
      onRestored(tool.id)
      setSelected(null)
    } catch { /* ignore */ }
  }

  const handleRun = () => {
    if (!selected) return
    onRunStart()
    RunToolVersion(selected.id, {})
  }

  // The "current" version is the one whose content matches the live tool exactly.
  // After a restore-without-new-version, this may be an older entry in the list.
  const currentVersionId = liveTool
    ? versions.find(v => contentMatchesLive(v, liveTool))?.id ?? null
    : null

  const isCurrentVersion = selected !== null && selected.id === currentVersionId

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Box className="flex items-center justify-between" sx={{ px: 3, py: 2 }}>
        <Box className="flex items-center gap-2">
          {selected && (
            <IconButton size="small" onClick={() => setSelected(null)} sx={{ color: 'text.secondary' }}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          )}
          <Typography variant="h6">{selected ? `v${selected.version}` : 'Versions'}</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />

      {selected ? (
        /* Detail view */
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box className="flex items-center gap-2 flex-wrap">
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{formatDate(selected.savedAt)}</Typography>
            {isCurrentVersion && (
              <Chip label="current" size="small" sx={{ bgcolor: 'rgba(124,106,247,0.15)', color: '#7c6af7' }} />
            )}
          </Box>

          <Box className="flex gap-2">
            <Button
              size="small"
              variant="outlined"
              startIcon={<PlayArrowIcon fontSize="small" />}
              onClick={handleRun}
              sx={{ borderColor: 'divider', color: 'text.secondary' }}
            >
              Run this version
            </Button>
            {!isCurrentVersion && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<RestoreIcon fontSize="small" />}
                onClick={handleRestore}
                sx={{ borderColor: 'divider', color: 'text.secondary' }}
              >
                Restore to current
              </Button>
            )}
          </Box>

          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Script</Typography>
          <Box
            component="pre"
            sx={{
              flex: 1,
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
              minHeight: 120,
            }}
          >
            {selected.body}
          </Box>
        </Box>
      ) : (
        /* List view */
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {summaries.length === 0 ? (
            <Typography variant="body2" sx={{ px: 3, py: 3, color: '#555' }}>
              No versions yet.
            </Typography>
          ) : (
            summaries.map(v => (
              <Box
                key={v.id}
                onClick={() => handleSelect(v.id)}
                className="flex items-center gap-3"
                sx={{
                  px: 3, py: 1.5,
                  cursor: 'pointer',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 32 }}>v{v.version}</Typography>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {formatDate(v.savedAt)}
                  </Typography>
                </Box>
                {v.id === currentVersionId && (
                  <Chip label="current" size="small" sx={{ bgcolor: 'rgba(124,106,247,0.15)', color: '#7c6af7' }} />
                )}
              </Box>
            ))
          )}
        </Box>
      )}
    </Box>
  )
}
