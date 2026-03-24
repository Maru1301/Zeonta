import { Box, Typography } from '@mui/material'
import TerminalIcon from '@mui/icons-material/Terminal'

export default function EmptyState() {
  return (
    <Box className="flex flex-col items-center justify-center h-full gap-3" sx={{ color: '#555' }}>
      <TerminalIcon sx={{ fontSize: 48, color: '#3a3a3a' }} />
      <Typography variant="body2" sx={{ color: '#555' }}>
        Select a tool or create a new one
      </Typography>
    </Box>
  )
}
