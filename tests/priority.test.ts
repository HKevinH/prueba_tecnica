import {
  classifyPolicyPriority,
  getDaysOverdue,
  PriorityBucket,
} from '../src/backend/src/services/priority'

function daysFromToday(days: number, reference: Date = new Date()): Date {
  const d = new Date(reference)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + days)
  return d
}

const TODAY = new Date('2026-06-12T00:00:00Z')

describe('classifyPolicyPriority — ventana de 30 días post-vencimiento', () => {
  /**
   * Caso más crítico del negocio:
   * Una póliza vencida hace 15 días TODAVÍA puede renovarse sin nueva contratación.
   * Si el asesor no actúa antes de que pasen 30 días, pierde la ventaja competitiva.
   */
  test('póliza vencida hace 15 días debe estar en critical_window', () => {
    const expiration = daysFromToday(-15, TODAY)
    const bucket = classifyPolicyPriority(expiration, TODAY)
    expect(bucket).toBe<PriorityBucket>('critical_window')
  })

  /**
   * Límite superior de la ventana: venció exactamente el día 30.
   * Aún dentro de la ventana — el asesor puede renovar sin competencia abierta.
   */
  test('póliza vencida hace exactamente 30 días debe estar en critical_window', () => {
    const expiration = daysFromToday(-30, TODAY)
    const bucket = classifyPolicyPriority(expiration, TODAY)
    expect(bucket).toBe<PriorityBucket>('critical_window')
  })

  /**
   * Un día después del límite: la renovación ya compite con cualquier intermediario.
   * Este es el punto de no retorno — el asesor pierde la ventaja.
   */
  test('póliza vencida hace 31 días debe estar en outside_window', () => {
    const expiration = daysFromToday(-31, TODAY)
    const bucket = classifyPolicyPriority(expiration, TODAY)
    expect(bucket).toBe<PriorityBucket>('outside_window')
  })
})

describe('classifyPolicyPriority — otros buckets', () => {
  test('póliza que vence hoy debe ser expires_today', () => {
    const expiration = daysFromToday(0, TODAY)
    expect(classifyPolicyPriority(expiration, TODAY)).toBe<PriorityBucket>('expires_today')
  })

  test('póliza que vence en 15 días debe ser expiring_soon', () => {
    const expiration = daysFromToday(15, TODAY)
    expect(classifyPolicyPriority(expiration, TODAY)).toBe<PriorityBucket>('expiring_soon')
  })

  test('póliza que vence en exactamente 30 días debe ser expiring_soon', () => {
    const expiration = daysFromToday(30, TODAY)
    expect(classifyPolicyPriority(expiration, TODAY)).toBe<PriorityBucket>('expiring_soon')
  })

  test('póliza que vence en 31 días debe ser active', () => {
    const expiration = daysFromToday(31, TODAY)
    expect(classifyPolicyPriority(expiration, TODAY)).toBe<PriorityBucket>('active')
  })

  test('póliza que vence en 1 día debe ser expiring_soon', () => {
    const expiration = daysFromToday(1, TODAY)
    expect(classifyPolicyPriority(expiration, TODAY)).toBe<PriorityBucket>('expiring_soon')
  })
})

describe('getDaysOverdue', () => {
  test('póliza vencida hace 5 días retorna 5', () => {
    const expiration = daysFromToday(-5, TODAY)
    expect(getDaysOverdue(expiration, TODAY)).toBe(5)
  })

  test('póliza que vence en 10 días retorna -10 (negativo = días hasta vencimiento)', () => {
    const expiration = daysFromToday(10, TODAY)
    expect(getDaysOverdue(expiration, TODAY)).toBe(-10)
  })

  test('póliza que vence hoy retorna 0', () => {
    const expiration = daysFromToday(0, TODAY)
    expect(getDaysOverdue(expiration, TODAY)).toBe(0)
  })
})
