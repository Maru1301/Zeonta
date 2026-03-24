import type { ToolSummary } from '../../types/tool'
import ToolListItem from './ToolListItem'

interface Props {
  tools: ToolSummary[]
  selectedToolId: string | null
  onSelectTool: (id: string) => void
}

export default function ToolList({ tools, selectedToolId, onSelectTool }: Props) {
  if (tools.length === 0) {
    return null
  }
  return (
    <>
      {tools.map(tool => (
        <ToolListItem
          key={tool.id}
          tool={tool}
          selected={tool.id === selectedToolId}
          onClick={() => onSelectTool(tool.id)}
        />
      ))}
    </>
  )
}
