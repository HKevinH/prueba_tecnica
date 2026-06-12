import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Select, MenuItem, FormControl,
  InputLabel, Alert, Box, Typography,
} from '@mui/material'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { registerAction } from '../api/client'
import { Policy, ActionType, ACTION_LABELS } from '../types'

interface Props {
  policy: Policy | null
  onClose: () => void
}

const CONTACT_TYPES: ActionType[] = ['llamada', 'whatsapp', 'correo', 'nota', 'renovacion', 'perdida']

export default function ActionDialog({ policy, onClose }: Props) {
  const [actionType, setActionType] = useState<ActionType>('llamada')
  const [notes, setNotes] = useState('')
  const [newExpirationDate, setNewExpirationDate] = useState('')
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () =>
      registerAction(policy!.id, {
        actionType,
        notes: notes || undefined,
        newExpirationDate: actionType === 'renovacion' ? newExpirationDate : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workload'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      handleClose()
    },
  })

  const handleClose = () => {
    setActionType('llamada')
    setNotes('')
    setNewExpirationDate('')
    onClose()
  }

  if (!policy) return null

  const isRenewal = actionType === 'renovacion'
  const isLost = actionType === 'perdida'

  return (
    <Dialog open={!!policy} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Registrar gestión
        <Typography variant="body2" color="text.secondary">
          {policy.client.name} — {policy.insurer} {policy.type.toUpperCase()}
        </Typography>
      </DialogTitle>
      <DialogContent>
        {mutation.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Error al registrar. Intenta de nuevo.
          </Alert>
        )}

        {policy.priorityBucket === 'critical_window' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Quedan {30 - policy.daysOverdue} días dentro de la ventana de renovación preferencial.
          </Alert>
        )}

        {policy.priorityBucket === 'outside_window' && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Fuera de ventana — la renovación se trata como nueva contratación y compite con otros intermediarios.
          </Alert>
        )}

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Tipo de gestión</InputLabel>
          <Select
            value={actionType}
            label="Tipo de gestión"
            onChange={(e) => setActionType(e.target.value as ActionType)}
          >
            {CONTACT_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {ACTION_LABELS[t]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {isRenewal && (
          <TextField
            label="Nueva fecha de vencimiento"
            type="date"
            fullWidth
            required
            value={newExpirationDate}
            onChange={(e) => setNewExpirationDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
        )}

        <TextField
          label={isLost ? 'Motivo (opcional)' : 'Notas (opcional)'}
          multiline
          rows={3}
          fullWidth
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={
            isLost
              ? 'ej: Se fue con otro asesor de Sura'
              : 'ej: Quedó de llamar el viernes para confirmar renovación'
          }
        />

        {isLost && (
          <Box mt={2}>
            <Alert severity="warning">
              La póliza se marcará como perdida y saldrá del listado de gestión.
            </Alert>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button
          variant="contained"
          color={isLost ? 'error' : 'primary'}
          disabled={mutation.isPending || (isRenewal && !newExpirationDate)}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? 'Guardando...' : 'Registrar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
