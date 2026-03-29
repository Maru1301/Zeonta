import { Box } from '@mui/material'
import type { RightSidebarContent } from '../../types/tabs'
import type { Tool } from '../../types/tool'
import VersionPanel from '../Versions/VersionPanel'
import ResizeHandle from './ResizeHandle'

interface Props {
  content: RightSidebarContent
  width: number
  onResize: (w: number) => void
  tool: Tool | null
  saveCount: number
  onRestored: (toolId: string) => void
  onRunStart: () => void
  onViewVersion: (toolId: string, versionId: string) => void
  onClose: () => void
}

export default function RightSidebar({
  content, width, onResize,
  tool, saveCount, onRestored, onRunStart, onViewVersion, onClose,
}: Props) {
  return (
    <Box sx={{ display: 'flex', flexShrink: 0 }}>
      <ResizeHandle direction="horizontal" currentSize={width} onResize={onResize} min={300} max={800} inverted />
      <Box
        sx={{
          width,
          bgcolor: 'background.paper',
          borderLeft: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {content?.kind === 'versions' && (
          <VersionPanel
            toolId={content.toolId}
            liveTool={tool}
            saveCount={saveCount}
            initialVersionId={content.initialVersionId}
            onClose={onClose}
            onRestored={onRestored}
            onRunStart={onRunStart}
          />
        )}
      </Box>
    </Box>
  )
}
