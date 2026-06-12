import { z } from 'zod'
import { ValidationMessages as VM, vm } from './messages'

const POLICY_TYPES = ['auto', 'hogar', 'vida', 'soat', 'otro'] as const
const ACTION_TYPES = ['llamada', 'whatsapp', 'correo', 'nota', 'renovacion', 'perdida'] as const
const POLICY_STATUSES = ['active', 'renewed', 'lost'] as const

export const createClientSchema = z.object({
  name: z.string().min(1, vm(VM.REQUIRED, 'El nombre')),
  phone: z.string().optional(),
  email: z.string().email(vm(VM.INVALID_EMAIL, 'El correo')).optional().or(z.literal('')),
})

export const updateClientSchema = z.object({
  name: z.string().min(1, vm(VM.MIN_LENGTH(1), 'El nombre')).optional(),
  phone: z.string().optional(),
  email: z.string().email(vm(VM.INVALID_EMAIL, 'El correo')).optional().or(z.literal('')),
})

export const createPolicySchema = z.object({
  clientId: z.string().min(1, vm(VM.REQUIRED, 'El cliente')),
  policyNumber: z.string().optional(),
  type: z.enum(POLICY_TYPES, {
    errorMap: () => ({ message: vm(VM.ENUM([...POLICY_TYPES]), 'El tipo') }),
  }),
  insurer: z.string().min(1, vm(VM.REQUIRED, 'La aseguradora')),
  expirationDate: z
    .string()
    .min(1, vm(VM.REQUIRED, 'La fecha de vencimiento'))
    .refine((v) => !isNaN(Date.parse(v)), vm(VM.INVALID_DATE, 'La fecha de vencimiento')),
  premium: z.number().positive(vm(VM.POSITIVE_NUMBER, 'La prima')).optional(),
})

export const updatePolicySchema = z.object({
  policyNumber: z.string().optional(),
  type: z
    .enum(POLICY_TYPES, { errorMap: () => ({ message: vm(VM.ENUM([...POLICY_TYPES]), 'El tipo') }) })
    .optional(),
  insurer: z.string().min(1, vm(VM.REQUIRED, 'La aseguradora')).optional(),
  expirationDate: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), vm(VM.INVALID_DATE, 'La fecha de vencimiento'))
    .optional(),
  premium: z.number().positive(vm(VM.POSITIVE_NUMBER, 'La prima')).optional(),
  status: z.enum(POLICY_STATUSES).optional(),
})

export const createActionSchema = z
  .object({
    actionType: z.enum(ACTION_TYPES, {
      errorMap: () => ({ message: vm(VM.ENUM([...ACTION_TYPES]), 'El tipo de gestión') }),
    }),
    notes: z.string().optional(),
    newExpirationDate: z
      .string()
      .refine((v) => !isNaN(Date.parse(v)), vm(VM.INVALID_DATE, 'La nueva fecha de vigencia'))
      .optional(),
  })
  .refine(
    (data) => data.actionType !== 'renovacion' || !!data.newExpirationDate,
    { message: vm(VM.REQUIRED, 'La nueva fecha de vigencia'), path: ['newExpirationDate'] },
  )

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
export type CreatePolicyInput = z.infer<typeof createPolicySchema>
export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>
export type CreateActionInput = z.infer<typeof createActionSchema>
