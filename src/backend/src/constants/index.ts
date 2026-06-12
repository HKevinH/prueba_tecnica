export const PolicyStatus = {
  ACTIVE: 'active',
  RENEWED: 'renewed',
  LOST: 'lost',
} as const

export type PolicyStatusValue = (typeof PolicyStatus)[keyof typeof PolicyStatus]

export const PolicyType = {
  AUTO: 'auto',
  HOGAR: 'hogar',
  VIDA: 'vida',
  SOAT: 'soat',
  OTRO: 'otro',
} as const

export type PolicyTypeValue = (typeof PolicyType)[keyof typeof PolicyType]

export const ActionType = {
  LLAMADA: 'llamada',
  WHATSAPP: 'whatsapp',
  CORREO: 'correo',
  NOTA: 'nota',
  RENOVACION: 'renovacion',
  PERDIDA: 'perdida',
} as const

export type ActionTypeValue = (typeof ActionType)[keyof typeof ActionType]
