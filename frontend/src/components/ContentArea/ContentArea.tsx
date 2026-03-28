import { Box } from '@mui/material'
import type { Tool } from '../../types/tool'
import EmptyState from './EmptyState'
import ToolDetail from './ToolDetail'

interface Props {
  tool: Tool | null
  onEdit: () => void
  onRun: (paramValues: Record<string, string>) => void
  onDeleted: () => void
  onVersions: () => void
}

export default function ContentArea({ tool, onEdit, onRun, onDeleted, onVersions }: Props) {
  return (
    <Box sx={{ height: '100%' }}>
      {tool ? (
        <ToolDetail tool={tool} onEdit={onEdit} onRun={onRun} onDeleted={onDeleted} onVersions={onVersions} />
      ) : (
        <EmptyState />
      )}
    </Box>
  )
}
