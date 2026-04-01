import { Box, Typography, Chip, useTheme } from '@mui/material'
import type { ToolSummary, ToolType } from '../../types/tool'
import { toolTypeConfig } from '../../types/tool'

interface Props {
  tool: ToolSummary
  selected: boolean
  onClick: () => void
}

export default function ToolListItem({ tool, selected, onClick }: Props) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const typeCfg = toolTypeConfig[tool.type as ToolType]
  const chipBg    = typeCfg?.chipBg ?? 'rgba(99,179,237,0.15)'
  const chipColor = isDark
    ? (typeCfg?.chipColor.dark  ?? '#63b3ed')
    : (typeCfg?.chipColor.light ?? '#2563eb')

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
          label={typeCfg?.label ?? tool.type}
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
