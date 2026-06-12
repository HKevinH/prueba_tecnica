import { PrismaClient } from '@prisma/client'
import { PolicyStatus } from './constants'

const prisma = new PrismaClient()

function daysFromToday(days: number): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + days)
  return d
}

async function main() {
  console.log('Limpiando datos anteriores...')
  await prisma.managementAction.deleteMany()
  await prisma.policy.deleteMany()
  await prisma.client.deleteMany()

  console.log('Creando clientes y pólizas...')

  const clients = await Promise.all([
    prisma.client.create({ data: { name: 'Andrea Morales', phone: '3001234567', email: 'andrea.morales@gmail.com' } }),
    prisma.client.create({ data: { name: 'Carlos Pérez', phone: '3109876543', email: 'cperez@hotmail.com' } }),
    prisma.client.create({ data: { name: 'Daniela Ríos', phone: '3154567890' } }),
    prisma.client.create({ data: { name: 'Eduardo Castillo', phone: '3006543210', email: 'ecastillo@empresa.co' } }),
    prisma.client.create({ data: { name: 'Fernanda Gómez', phone: '3187654321' } }),
    prisma.client.create({ data: { name: 'Gabriel Vargas', phone: '3052345678', email: 'gvargas@gmail.com' } }),
    prisma.client.create({ data: { name: 'Helena Suárez', phone: '3141234567' } }),
    prisma.client.create({ data: { name: 'Iván Torres', phone: '3168765432', email: 'itorresr@gmail.com' } }),
    prisma.client.create({ data: { name: 'Juliana Castro', phone: '3002345678' } }),
    prisma.client.create({ data: { name: 'Kevin Rojas', phone: '3125678901', email: 'kevin.rojas@outlook.com' } }),
    prisma.client.create({ data: { name: 'Laura Mendoza', phone: '3059876543' } }),
    prisma.client.create({ data: { name: 'Mauricio Ortega', phone: '3171234567', email: 'mortega@empresa.com' } }),
    prisma.client.create({ data: { name: 'Natalia Herrera', phone: '3043456789' } }),
    prisma.client.create({ data: { name: 'Óscar Ramírez', phone: '3137890123', email: 'oscar.r@gmail.com' } }),
    prisma.client.create({ data: { name: 'Patricia Silva', phone: '3016789012' } }),
  ])

  const [andrea, carlos, daniela, eduardo, fernanda, gabriel, helena, ivan, juliana, kevin, laura, mauricio, natalia, oscar, patricia] = clients

  const insurers = ['Sura', 'Bolívar', 'Mapfre', 'Liberty', 'Allianz', 'AXA Colpatria']
  const types = ['auto', 'auto', 'auto', 'hogar', 'vida', 'soat']

  const policies = await Promise.all([
    // VENCE HOY
    prisma.policy.create({ data: { clientId: andrea.id, policyNumber: 'SUC-2024-001', type: 'auto', insurer: 'Sura', expirationDate: daysFromToday(0), premium: 1850000 } }),

    // VENTANA CRÍTICA (venció 1–30 días) — los más urgentes
    prisma.policy.create({ data: { clientId: carlos.id, policyNumber: 'BOL-2024-082', type: 'auto', insurer: 'Bolívar', expirationDate: daysFromToday(-5), premium: 2100000 } }),
    prisma.policy.create({ data: { clientId: daniela.id, policyNumber: 'MAP-2024-103', type: 'auto', insurer: 'Mapfre', expirationDate: daysFromToday(-12), premium: 980000 } }),
    prisma.policy.create({ data: { clientId: eduardo.id, policyNumber: 'LIB-2024-047', type: 'hogar', insurer: 'Liberty', expirationDate: daysFromToday(-20), premium: 450000 } }),
    prisma.policy.create({ data: { clientId: fernanda.id, policyNumber: 'SUC-2024-215', type: 'auto', insurer: 'Sura', expirationDate: daysFromToday(-28), premium: 1650000 } }),
    prisma.policy.create({ data: { clientId: gabriel.id, policyNumber: 'AXA-2024-009', type: 'auto', insurer: 'AXA Colpatria', expirationDate: daysFromToday(-3), premium: 1900000 } }),

    // FUERA DE VENTANA (venció hace más de 30 días — competencia abierta)
    prisma.policy.create({ data: { clientId: helena.id, policyNumber: 'ALI-2023-332', type: 'auto', insurer: 'Allianz', expirationDate: daysFromToday(-45), premium: 1200000 } }),
    prisma.policy.create({ data: { clientId: ivan.id, policyNumber: 'BOL-2023-198', type: 'vida', insurer: 'Bolívar', expirationDate: daysFromToday(-60), premium: 320000 } }),

    // POR VENCER (vence en 1–30 días)
    prisma.policy.create({ data: { clientId: juliana.id, policyNumber: 'SUC-2025-011', type: 'auto', insurer: 'Sura', expirationDate: daysFromToday(7), premium: 1750000 } }),
    prisma.policy.create({ data: { clientId: kevin.id, policyNumber: 'MAP-2025-077', type: 'soat', insurer: 'Mapfre', expirationDate: daysFromToday(15), premium: 210000 } }),
    prisma.policy.create({ data: { clientId: laura.id, policyNumber: 'LIB-2025-044', type: 'auto', insurer: 'Liberty', expirationDate: daysFromToday(22), premium: 2200000 } }),
    prisma.policy.create({ data: { clientId: mauricio.id, policyNumber: 'AXA-2025-031', type: 'hogar', insurer: 'AXA Colpatria', expirationDate: daysFromToday(29), premium: 580000 } }),

    // VIGENTES (vence en 30+ días — no requieren acción aún)
    prisma.policy.create({ data: { clientId: natalia.id, policyNumber: 'SUC-2025-088', type: 'auto', insurer: 'Sura', expirationDate: daysFromToday(60), premium: 1350000 } }),
    prisma.policy.create({ data: { clientId: oscar.id, policyNumber: 'BOL-2025-122', type: 'auto', insurer: 'Bolívar', expirationDate: daysFromToday(90), premium: 1800000 } }),

    // RENOVADAS
    prisma.policy.create({ data: { clientId: patricia.id, policyNumber: 'MAP-2025-055', type: 'auto', insurer: 'Mapfre', expirationDate: daysFromToday(180), premium: 1550000, status: PolicyStatus.RENEWED } }),
    prisma.policy.create({ data: { clientId: andrea.id, policyNumber: 'LIB-2025-099', type: 'hogar', insurer: 'Liberty', expirationDate: daysFromToday(200), premium: 420000, status: PolicyStatus.RENEWED } }),
  ])

  // Registrar acciones de gestión en algunas pólizas
  const [andreaAuto, carlosAuto, danielaAuto, , , gabrielAuto, , , , , , , , , patriciaAuto] = policies

  await prisma.managementAction.create({
    data: { policyId: carlosAuto.id, actionType: 'llamada', notes: 'No contestó, dejé mensaje de voz' },
  })
  await prisma.managementAction.create({
    data: { policyId: carlosAuto.id, actionType: 'whatsapp', notes: 'Envié mensaje por WhatsApp, sin respuesta aún' },
  })
  await prisma.managementAction.create({
    data: { policyId: danielaAuto.id, actionType: 'llamada', notes: 'Habló conmigo, está evaluando opciones. Llama la próxima semana.' },
  })
  await prisma.managementAction.create({
    data: { policyId: andreaAuto.id, actionType: 'whatsapp', notes: 'Le recordé que vence hoy. Confirmó que quiere renovar.' },
  })
  await prisma.managementAction.create({
    data: {
      policyId: patriciaAuto.id,
      actionType: 'renovacion',
      notes: 'Renovación exitosa con Mapfre',
      newExpirationDate: daysFromToday(180),
    },
  })
  await prisma.managementAction.create({
    data: { policyId: gabrielAuto.id, actionType: 'correo', notes: 'Envié cotización actualizada por correo' },
  })

  console.log(`✓ ${clients.length} clientes creados`)
  console.log(`✓ ${policies.length} pólizas creadas`)
  console.log('✓ Acciones de gestión registradas')
  console.log('\nDistribución de pólizas activas:')
  console.log('  1 vence hoy')
  console.log('  6 en ventana crítica (venció 1–30 días)')
  console.log('  2 fuera de ventana (venció 30+ días)')
  console.log('  4 por vencer (1–30 días)')
  console.log('  2 vigentes (30+ días)')
  console.log('  2 renovadas')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
