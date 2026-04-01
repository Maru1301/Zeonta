import { Box } from '@mui/material'
import type { Tool, Platform } from '../../types/tool'
import EmptyState from './EmptyState'
import ToolDetail from './ToolDetail'

interface Props {
  tool: Tool | null
  onSaved: (id: string) => void
  onRun: (paramValues: Record<string, string>) => void
  onDeleted: () => void
  platform: Platform
}

export default function ContentArea({ tool, onSaved, onRun, onDeleted, platform }: Props) {
  return (
    <Box sx={{ height: '100%' }}>
      {tool ? (
        <ToolDetail tool={tool} onSaved={onSaved} onRun={onRun} onDeleted={onDeleted} platform={platform} />
      ) : (
        <EmptyState />
      )}
    </Box>
  )
}
