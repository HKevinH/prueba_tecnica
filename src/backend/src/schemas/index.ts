import { z } from 'zod'

export const createClientSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  phone: z.string().optional(),
  email: z.string().email('Correo electrónico inválido').optional().or(z.literal('')),
})

export const updateClientSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').optional(),
  phone: z.string().optional(),
  email: z.string().email('Correo electrónico inválido').optional().or(z.literal('')),
})

export const createPolicySchema = z.object({
  clientId: z.string().min(1, 'El cliente es requerido'),
  policyNumber: z.string().optional(),
  type: z.enum(['auto', 'hogar', 'vida', 'soat', 'otro'], {
    errorMap: () => ({ message: 'Tipo debe ser: auto, hogar, vida, soat u otro' }),
  }),
  insurer: z.string().min(1, 'La aseguradora es requerida'),
  expirationDate: z
    .string()
    .min(1, 'La fecha de vencimiento es requerida')
    .refine((v) => !isNaN(Date.parse(v)), 'Fecha de vencimiento inválida'),
  premium: z.number().positive('La prima debe ser un valor positivo').optional(),
})

export const updatePolicySchema = z.object({
  policyNumber: z.string().optional(),
  type: z
    .enum(['auto', 'hogar', 'vida', 'soat', 'otro'], {
      errorMap: () => ({ message: 'Tipo debe ser: auto, hogar, vida, soat u otro' }),
    })
    .optional(),
  insurer: z.string().min(1, 'La aseguradora es requerida').optional(),
  expirationDate: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), 'Fecha de vencimiento inválida')
    .optional(),
  premium: z.number().positive('La prima debe ser un valor positivo').optional(),
  status: z.enum(['active', 'renewed', 'lost']).optional(),
})

export const createActionSchema = z
  .object({
    actionType: z.enum(['llamada', 'whatsapp', 'correo', 'nota', 'renovacion', 'perdida'], {
      errorMap: () => ({
        message: 'actionType debe ser: llamada, whatsapp, correo, nota, renovacion o perdida',
      }),
    }),
    notes: z.string().optional(),
    newExpirationDate: z
      .string()
      .refine((v) => !isNaN(Date.parse(v)), 'Fecha de nueva vigencia inválida')
      .optional(),
  })
  .refine(
    (data) => data.actionType !== 'renovacion' || !!data.newExpirationDate,
    { message: 'newExpirationDate es requerida para una renovación', path: ['newExpirationDate'] },
  )

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
export type CreatePolicyInput = z.infer<typeof createPolicySchema>
export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>
export type CreateActionInput = z.infer<typeof createActionSchema>
