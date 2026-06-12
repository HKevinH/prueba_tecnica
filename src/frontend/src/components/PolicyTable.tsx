import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Tooltip, Typography, Box, Chip, Skeleton,
} from '@mui/material'
import PhoneIcon from '@mui/icons-material/Phone'
import EditNoteIcon from '@mui/icons-material/EditNote'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { Policy } from '../types'
import PriorityChip from './PriorityChip'

interface Props {
  policies: Policy[] | undefined
  loading: boolean
  onAction: (policy: Policy) => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatCurrency(value: number | null) {
  if (!value) return '—'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)
}

function DaysOverdueLabel({ days, bucket }: { days: number; bucket: string }) {
  if (bucket === 'expires_today') return <Typography color="error" fontWeight={600} variant="body2">Vence hoy</Typography>
  if (days < 0) return <Typography color="warning.dark" variant="body2">{Math.abs(days)} días</Typography>
  if (days > 0 && days <= 30) return (
    <Box>
      <Typography color="error" fontWeight={600} variant="body2">{days} días vencida</Typography>
      <Typography variant="caption" color="text.secondary">{30 - days} días restantes en ventana</Typography>
    </Box>
  )
  return <Typography color="text.secondary" variant="body2">{days} días vencida</Typography>
}

export default function PolicyTable({ policies, loading, onAction }: Props) {
  if (loading) {
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
                  <TableCell key={j}><Skeleton /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )
  }

  if (!policies?.length) {
    return (
      <Paper sx={{ p: 6, textAlign: 'center' }}>
        <Typography color="text.secondary">No hay pólizas que gestionar con este filtro.</Typography>
      </Paper>
    )
  }

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.100' }}>
            <TableCell><strong>Estado</strong></TableCell>
            <TableCell><strong>Cliente</strong></TableCell>
            <TableCell><strong>Póliza</strong></TableCell>
            <TableCell><strong>Vencimiento</strong></TableCell>
            <TableCell><strong>Días</strong></TableCell>
            <TableCell><strong>Última gestión</strong></TableCell>
            <TableCell align="right"><strong>Acciones</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {policies.map((p) => (
            <TableRow
              key={p.id}
              sx={{
                bgcolor:
                  p.priorityBucket === 'expires_today'
                    ? '#FFEBEE'
                    : p.priorityBucket === 'critical_window'
                    ? '#FFF8E1'
                    : undefined,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <TableCell>
                <PriorityChip bucket={p.priorityBucket} />
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>{p.client.name}</Typography>
                {p.client.phone && (
                  <Typography variant="caption" color="text.secondary">{p.client.phone}</Typography>
                )}
              </TableCell>
              <TableCell>
                <Typography variant="body2">{p.insurer}</Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                  <Chip label={p.type} size="small" variant="outlined" />
                  {p.policyNumber && (
                    <Typography variant="caption" color="text.secondary">{p.policyNumber}</Typography>
                  )}
                </Box>
                {p.premium && (
                  <Typography variant="caption" color="text.secondary">{formatCurrency(p.premium)}</Typography>
                )}
              </TableCell>
              <TableCell>
                <Typography variant="body2">{formatDate(p.expirationDate)}</Typography>
              </TableCell>
              <TableCell>
                <DaysOverdueLabel days={p.daysOverdue} bucket={p.priorityBucket} />
              </TableCell>
              <TableCell>
                {p.lastAction ? (
                  <Box>
                    <Typography variant="caption" fontWeight={600}>{p.lastAction.actionType}</Typography>
                    {p.lastAction.notes && (
                      <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ maxWidth: 180 }}>
                        {p.lastAction.notes}
                      </Typography>
                    )}
                    <Chip
                      label={`${p.contactCount} gestión${p.contactCount !== 1 ? 'es' : ''}`}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                ) : (
                  <Typography variant="caption" color="text.secondary">Sin gestiones</Typography>
                )}
              </TableCell>
              <TableCell align="right">
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                  {p.client.phone && (
                    <Tooltip title={`Llamar a ${p.client.phone}`}>
                      <IconButton size="small" component="a" href={`tel:${p.client.phone}`}>
                        <PhoneIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Registrar gestión">
                    <IconButton size="small" color="primary" onClick={() => onAction(p)}>
                      <EditNoteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Renovar póliza">
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => onAction({ ...p, _openRenewal: true } as any)}
                    >
                      <CheckCircleOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
