import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Alert,
} from '@mui/material'
import { useNewClientForm } from '../hooks/useNewClientForm'

interface Props {
  open: boolean
  onClose: () => void
}

export default function NewClientDialog({ open, onClose }: Props) {
  const { fields, setters, mutation, handleClose, isValid } = useNewClientForm({ onClose })

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Nuevo cliente</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        {mutation.isError && <Alert severity="error">Error al crear el cliente.</Alert>}
        <TextField
          label="Nombre completo"
          required
          value={fields.name}
          onChange={(e) => setters.setName(e.target.value)}
          autoFocus
        />
        <TextField
          label="Teléfono"
          value={fields.phone}
          onChange={(e) => setters.setPhone(e.target.value)}
          placeholder="3001234567"
        />
        <TextField
          label="Correo electrónico"
          type="email"
          value={fields.email}
          onChange={(e) => setters.setEmail(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button
          variant="contained"
          disabled={!isValid || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? 'Creando...' : 'Crear cliente'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
