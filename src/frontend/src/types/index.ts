export type PriorityBucket =
  | 'active'
  | 'expiring_soon'
  | 'expires_today'
  | 'critical_window'
  | 'outside_window'

export interface Client {
  id: string
  name: string
  phone: string | null
  email: string | null
  createdAt: string
  updatedAt: string
}

export interface Policy {
  id: string
  clientId: string
  policyNumber: string | null
  type: string
  insurer: string
  expirationDate: string
  premium: number | null
  status: string
  priorityBucket: PriorityBucket
  priorityLabel: string
  daysOverdue: number
  client: Pick<Client, 'id' | 'name' | 'phone' | 'email'>
  lastAction: ManagementAction | null
  contactCount: number
}

export interface ManagementAction {
  id: string
  policyId: string
  actionType: string
  notes: string | null
  newExpirationDate: string | null
  createdAt: string
}

export interface DashboardStats {
  total: number
  active: number
  expiring_soon: number
  expires_today: number
  critical_window: number
  outside_window: number
  renewed: number
  lost: number
  urgent: number
}

export type ActionType = 'llamada' | 'whatsapp' | 'correo' | 'nota' | 'renovacion' | 'perdida'

export const ACTION_LABELS: Record<ActionType, string> = {
  llamada: 'Llamada',
  whatsapp: 'WhatsApp',
  correo: 'Correo',
  nota: 'Nota',
  renovacion: 'Renovación',
  perdida: 'Marcar como perdida',
}

export const POLICY_TYPES = ['auto', 'hogar', 'vida', 'soat', 'otro'] as const
export const INSURERS = ['Sura', 'Bolívar', 'Mapfre', 'Liberty', 'Allianz', 'AXA Colpatria', 'Otra']
