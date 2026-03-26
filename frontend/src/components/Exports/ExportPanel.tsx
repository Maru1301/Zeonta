import { useState } from 'react'
import { Box, Typography, Checkbox, Button, Divider, Chip } from '@mui/material'
import type { ToolSummary } from '../../types/tool'

interface Props {
  tools: ToolSummary[]
  onExport: (ids: string[]) => Promise<boolean>
  onClose: () => void
}

export default function ExportPanel({ tools, onExport, onClose }: Props) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(tools.map(t => t.id)))
  const [exporting, setExporting] = useState(false)

  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const allSelected = tools.length > 0 && selected.size === tools.length
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(tools.map(t => t.id)))

  const handleExport = async () => {
    setExporting(true)
    const didExport = await onExport([...selected])
    setExporting(false)
    if (didExport) onClose()
  }

  return (
    <Box sx={{ p: 3, maxWidth: 720 }}>
      {/* Header */}
      <Box className="flex items-center justify-between gap-2" sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Export Tools</Typography>
        <Box className="flex gap-1">
          <Button size="small" onClick={toggleAll} sx={{ color: 'text.secondary' }}>
            {allSelected ? 'Deselect All' : 'Select All'}
          </Button>
          <Button size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button
            size="small"
            variant="contained"
            disabled={selected.size === 0 || exporting}
            onClick={handleExport}
          >
            Export{selected.size > 0 ? ` (${selected.size})` : ''}
          </Button>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {tools.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>No tools to export.</Typography>
      ) : (
        <Box>
          {tools.map(t => (
            <Box
              key={t.id}
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => toggle(t.id)}
              sx={{ py: 0.75, px: 1, borderRadius: 1, '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}
            >
              <Checkbox
                checked={selected.has(t.id)}
                size="small"
                onChange={() => toggle(t.id)}
                onClick={e => e.stopPropagation()}
              />
              <Typography variant="body2" sx={{ flex: 1 }}>{t.name}</Typography>
              <Chip
                label={t.type}
                size="small"
                sx={{
                  bgcolor: t.type === 'shell' ? 'rgba(34,197,94,0.15)' : 'rgba(99,179,237,0.15)',
                  color: t.type === 'shell' ? '#4ade80' : '#63b3ed',
                  fontSize: 11,
                }}
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}
