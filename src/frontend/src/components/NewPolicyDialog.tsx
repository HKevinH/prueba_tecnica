import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Select, MenuItem, FormControl,
  InputLabel, Alert, Autocomplete,
} from '@mui/material'
import { useNewPolicyForm } from '../hooks/useNewPolicyForm'
import { POLICY_TYPES, INSURERS } from '../types'

interface Props {
  open: boolean
  onClose: () => void
}

export default function NewPolicyDialog({ open, onClose }: Props) {
  const { fields, setters, clients, mutation, handleClose, isValid } = useNewPolicyForm({ onClose })

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Nueva póliza</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        {mutation.isError && <Alert severity="error">Error al crear la póliza.</Alert>}

        <FormControl fullWidth required>
          <InputLabel>Cliente</InputLabel>
          <Select value={fields.clientId} label="Cliente" onChange={(e) => setters.setClientId(e.target.value)}>
            {clients.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Número de póliza"
          value={fields.policyNumber}
          onChange={(e) => setters.setPolicyNumber(e.target.value)}
          placeholder="ej: SUC-2025-001"
        />

        <FormControl fullWidth>
          <InputLabel>Tipo</InputLabel>
          <Select value={fields.type} label="Tipo" onChange={(e) => setters.setType(e.target.value)}>
            {POLICY_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Autocomplete
          options={INSURERS}
          freeSolo
          value={fields.insurer}
          onInputChange={(_e, v) => setters.setInsurer(v)}
          renderInput={(params) => <TextField {...params} label="Aseguradora" required />}
        />

        <TextField
          label="Fecha de vencimiento"
          type="date"
          required
          value={fields.expirationDate}
          onChange={(e) => setters.setExpirationDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          label="Prima anual (COP)"
          type="number"
          value={fields.premium}
          onChange={(e) => setters.setPremium(e.target.value)}
          placeholder="ej: 1850000"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button variant="contained" disabled={!isValid || mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? 'Creando...' : 'Crear póliza'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
