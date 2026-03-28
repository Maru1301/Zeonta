import { Box } from '@mui/material'
import type { RightSidebarContent } from '../../types/tabs'
import type { Tool } from '../../types/tool'
import type { EditPanelMode } from '../../App'
import EditPanel from '../EditPanel/EditPanel'
import VersionPanel from '../Versions/VersionPanel'
import ResizeHandle from './ResizeHandle'

interface Props {
  content: RightSidebarContent
  width: number
  onResize: (w: number) => void
  // EditPanel props
  tool: Tool | null
  onSaved: (id: string) => void
  // VersionPanel props
  saveCount: number
  onRestored: (toolId: string) => void
  onRunStart: () => void
  // shared
  onClose: () => void
}

export default function RightSidebar({
  content, width, onResize,
  tool, onSaved,
  saveCount, onRestored, onRunStart,
  onClose,
}: Props) {
  if (!content) return null

  const editMode: EditPanelMode = content.kind === 'edit' ? content.mode : null

  return (
    <Box sx={{ display: 'flex', flexShrink: 0 }}>
      <ResizeHandle direction="horizontal" currentSize={width} onResize={onResize} min={300} max={800} />
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
        {content.kind === 'edit' && (
          <EditPanel
            mode={editMode}
            tool={tool}
            onSaved={onSaved}
            onClose={onClose}
          />
        )}
        {content.kind === 'versions' && (
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
