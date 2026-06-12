import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Alert,
} from '@mui/material'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '../api/client'

interface Props {
  open: boolean
  onClose: () => void
}

export default function NewClientDialog({ open, onClose }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => createClient({ name, phone: phone || undefined, email: email || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      handleClose()
    },
  })

  const handleClose = () => {
    setName('')
    setPhone('')
    setEmail('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Nuevo cliente</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        {mutation.isError && <Alert severity="error">Error al crear el cliente.</Alert>}
        <TextField
          label="Nombre completo"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <TextField
          label="Teléfono"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="3001234567"
        />
        <TextField
          label="Correo electrónico"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button
          variant="contained"
          disabled={!name.trim() || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? 'Creando...' : 'Crear cliente'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
