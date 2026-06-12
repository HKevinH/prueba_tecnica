import { Chip } from '@mui/material'
import { PriorityBucket } from '../types'

const CONFIG: Record<PriorityBucket, { label: string; color: 'error' | 'warning' | 'default' | 'success' | 'info' }> = {
  expires_today: { label: 'Vence hoy', color: 'error' },
  critical_window: { label: 'Ventana crítica', color: 'warning' },
  expiring_soon: { label: 'Por vencer', color: 'info' },
  outside_window: { label: 'Fuera de ventana', color: 'default' },
  active: { label: 'Vigente', color: 'success' },
}

export default function PriorityChip({ bucket }: { bucket: PriorityBucket }) {
  const { label, color } = CONFIG[bucket]
  return <Chip label={label} color={color} size="small" variant="filled" />
}
