import { Box, Typography, Chip, useTheme } from '@mui/material'
import type { ToolSummary } from '../../types/tool'

interface Props {
  tool: ToolSummary
  selected: boolean
  onClick: () => void
}

export default function ToolListItem({ tool, selected, onClick }: Props) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const chipBg   = tool.type === 'shell'
    ? (isDark ? 'rgba(34,197,94,0.15)'  : 'rgba(34,197,94,0.25)')
    : (isDark ? 'rgba(99,179,237,0.15)' : 'rgba(99,179,237,0.25)')
  const chipColor = tool.type === 'shell'
    ? (isDark ? '#4ade80' : '#16a34a')
    : (isDark ? '#63b3ed' : '#2563eb')

  return (
    <Box
      onClick={onClick}
      sx={{
        px: 2,
        py: 1.5,
        cursor: 'pointer',
        bgcolor: selected ? 'rgba(124,106,247,0.15)' : 'transparent',
        borderLeft: selected ? '2px solid #7c6af7' : '2px solid transparent',
        '&:hover': { bgcolor: selected ? 'rgba(124,106,247,0.15)' : 'action.hover' },
      }}
    >
      <Box className="flex items-center justify-between gap-2">
        <Typography
          variant="body2"
          noWrap
          sx={{ color: selected ? 'text.primary' : 'text.secondary', fontWeight: selected ? 500 : 400 }}
        >
          {tool.name}
        </Typography>
        <Chip
          label={tool.type}
          size="small"
          sx={{
            height: 18,
            fontSize: 10,
            bgcolor: chipBg,
            color: chipColor,
            border: 'none',
            flexShrink: 0,
          }}
        />
      </Box>
      {tool.desc && (
        <Typography variant="caption" noWrap sx={{ color: 'text.disabled', display: 'block', mt: 0.25 }}>
          {tool.desc}
        </Typography>
      )}
    </Box>
  )
}
