import { Box, TextField, IconButton, Button, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import type { EnvVar } from '../../types/tool'

interface Props {
  envVars: EnvVar[]
  onChange: (envVars: EnvVar[]) => void
  readonlyKeys?: boolean  // true in run mode: keys are fixed, only values editable
}

export default function EnvVarEditor({ envVars, onChange, readonlyKeys = false }: Props) {
  const add = () => onChange([...envVars, { id: '', key: '', value: '', sortOrder: envVars.length }])
  const remove = (i: number) => onChange(envVars.filter((_, idx) => idx !== i))
  const update = (i: number, field: keyof EnvVar, value: string) => {
    const updated = [...envVars]
    updated[i] = { ...updated[i], [field]: value }
    onChange(updated)
  }

  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
        Environment Variables
      </Typography>
      {envVars.map((e, i) => (
        <Box key={i} className="flex gap-2 items-center" sx={{ mb: 1 }}>
          <TextField
            size="small"
            placeholder="KEY"
            value={e.key}
            onChange={ev => update(i, 'key', ev.target.value)}
            disabled={readonlyKeys}
            sx={{ flex: 1, fontFamily: 'monospace' }}
          />
          <TextField
            size="small"
            placeholder="value"
            value={e.value}
            onChange={ev => update(i, 'value', ev.target.value)}
            sx={{ flex: 1 }}
          />
          {!readonlyKeys && (
            <IconButton size="small" onClick={() => remove(i)} sx={{ color: 'text.secondary' }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      ))}
      {!readonlyKeys && (
        <Button size="small" startIcon={<AddIcon />} onClick={add} sx={{ color: 'text.secondary', mt: 0.5 }}>
          Add env var
        </Button>
      )}
    </Box>
  )
}
