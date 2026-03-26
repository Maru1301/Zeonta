import { Box, TextField, IconButton, Button, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import type { Param } from '../../types/tool'

interface Props {
  params: Param[]
  onChange: (params: Param[]) => void
}

export default function ParamEditor({ params, onChange }: Props) {
  const add = () => onChange([...params, { id: '', name: '', default: '', sortOrder: params.length }])
  const remove = (i: number) => onChange(params.filter((_, idx) => idx !== i))
  const update = (i: number, field: keyof Param, value: string) => {
    const updated = [...params]
    updated[i] = { ...updated[i], [field]: value }
    onChange(updated)
  }

  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
        Parameters
      </Typography>
      {params.map((p, i) => (
        <Box key={i} className="flex gap-2 items-center" sx={{ mb: 1 }}>
          <TextField
            size="small"
            placeholder="Name"
            value={p.name}
            onChange={e => update(i, 'name', e.target.value)}
            sx={{ flex: 1 }}
          />
          <TextField
            size="small"
            placeholder="Default value"
            value={p.default}
            onChange={e => update(i, 'default', e.target.value)}
            sx={{ flex: 1 }}
          />
          <IconButton size="small" onClick={() => remove(i)} sx={{ color: 'text.secondary' }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ))}
      <Button size="small" startIcon={<AddIcon />} onClick={add} sx={{ color: 'text.secondary', mt: 0.5 }}>
        Add parameter
      </Button>
    </Box>
  )
}
