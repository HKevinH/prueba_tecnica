import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Select, MenuItem, FormControl,
  InputLabel, Alert, Autocomplete,
} from '@mui/material'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createPolicy, getClients } from '../api/client'
import { POLICY_TYPES, INSURERS } from '../types'

interface Props {
  open: boolean
  onClose: () => void
}

export default function NewPolicyDialog({ open, onClose }: Props) {
  const [clientId, setClientId] = useState('')
  const [policyNumber, setPolicyNumber] = useState('')
  const [type, setType] = useState('auto')
  const [insurer, setInsurer] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [premium, setPremium] = useState('')
  const qc = useQueryClient()

  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => getClients() })

  const mutation = useMutation({
    mutationFn: () =>
      createPolicy({
        clientId,
        policyNumber: policyNumber || undefined,
        type,
        insurer,
        expirationDate,
        premium: premium ? Number(premium) : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workload'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      handleClose()
    },
  })

  const handleClose = () => {
    setClientId('')
    setPolicyNumber('')
    setType('auto')
    setInsurer('')
    setExpirationDate('')
    setPremium('')
    onClose()
  }

  const isValid = clientId && insurer && expirationDate

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Nueva póliza</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        {mutation.isError && <Alert severity="error">Error al crear la póliza.</Alert>}

        <FormControl fullWidth required>
          <InputLabel>Cliente</InputLabel>
          <Select value={clientId} label="Cliente" onChange={(e) => setClientId(e.target.value)}>
            {clients.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Número de póliza"
          value={policyNumber}
          onChange={(e) => setPolicyNumber(e.target.value)}
          placeholder="ej: SUC-2025-001"
        />

        <FormControl fullWidth>
          <InputLabel>Tipo</InputLabel>
          <Select value={type} label="Tipo" onChange={(e) => setType(e.target.value)}>
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
          value={insurer}
          onInputChange={(_e, v) => setInsurer(v)}
          renderInput={(params) => <TextField {...params} label="Aseguradora" required />}
        />

        <TextField
          label="Fecha de vencimiento"
          type="date"
          required
          value={expirationDate}
          onChange={(e) => setExpirationDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          label="Prima anual (COP)"
          type="number"
          value={premium}
          onChange={(e) => setPremium(e.target.value)}
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
