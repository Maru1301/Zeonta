import { Box, Typography, Chip } from '@mui/material'
import type { ToolSummary } from '../../types/tool'

interface Props {
  tool: ToolSummary
  selected: boolean
  onClick: () => void
}

export default function ToolListItem({ tool, selected, onClick }: Props) {
  return (
    <Box
      onClick={onClick}
      sx={{
        px: 2,
        py: 1.5,
        cursor: 'pointer',
        bgcolor: selected ? 'rgba(124,106,247,0.15)' : 'transparent',
        borderLeft: selected ? '2px solid #7c6af7' : '2px solid transparent',
        '&:hover': { bgcolor: selected ? 'rgba(124,106,247,0.15)' : 'rgba(255,255,255,0.04)' },
      }}
    >
      <Box className="flex items-center justify-between gap-2">
        <Typography
          variant="body2"
          noWrap
          sx={{ color: selected ? '#dcdcdc' : '#aaaaaa', fontWeight: selected ? 500 : 400 }}
        >
          {tool.name}
        </Typography>
        <Chip
          label={tool.type}
          size="small"
          sx={{
            height: 18,
            fontSize: 10,
            bgcolor: tool.type === 'shell' ? 'rgba(34,197,94,0.15)' : 'rgba(99,179,237,0.15)',
            color: tool.type === 'shell' ? '#4ade80' : '#63b3ed',
            border: 'none',
            flexShrink: 0,
          }}
        />
      </Box>
      {tool.desc && (
        <Typography variant="caption" noWrap sx={{ color: '#666', display: 'block', mt: 0.25 }}>
          {tool.desc}
        </Typography>
      )}
    </Box>
  )
}
