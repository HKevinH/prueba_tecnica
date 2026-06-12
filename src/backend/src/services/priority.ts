export type PriorityBucket =
  | 'active'          // vence en más de 30 días — sin urgencia
  | 'expiring_soon'   // vence en 1–30 días — contacto proactivo
  | 'expires_today'   // vence hoy — urgente
  | 'critical_window' // venció hace 1–30 días — CRÍTICO: aún renovable sin nueva contratación
  | 'outside_window'  // venció hace más de 30 días — cliente compite con otros intermediarios

export const BUCKET_PRIORITY: Record<PriorityBucket, number> = {
  expires_today: 0,
  critical_window: 1,
  expiring_soon: 2,
  outside_window: 3,
  active: 4,
}

export const BUCKET_LABEL: Record<PriorityBucket, string> = {
  expires_today: 'Vence hoy',
  critical_window: 'Ventana crítica',
  expiring_soon: 'Por vencer',
  outside_window: 'Fuera de ventana',
  active: 'Vigente',
}

/**
 * Clasifica una póliza según cuántos días le quedan o llevan vencida.
 * La ventana de 30 días post-vencimiento es crítica para el negocio colombiano:
 * dentro de ella el mismo intermediario puede renovar sin nueva contratación.
 */
export function classifyPolicyPriority(expirationDate: Date, today: Date = new Date()): PriorityBucket {
  const expDay = toDateOnly(expirationDate)
  const todayDay = toDateOnly(today)

  const diffDays = daysBetween(expDay, todayDay) // positive = días DESDE vencimiento

  if (diffDays < 0 && Math.abs(diffDays) > 30) return 'active'
  if (diffDays < 0) return 'expiring_soon'
  if (diffDays === 0) return 'expires_today'
  if (diffDays <= 30) return 'critical_window'
  return 'outside_window'
}

export function getDaysOverdue(expirationDate: Date, today: Date = new Date()): number {
  const expDay = toDateOnly(expirationDate)
  const todayDay = toDateOnly(today)
  return daysBetween(expDay, todayDay)
}

function toDateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}
