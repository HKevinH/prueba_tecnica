import { Router, Request, Response, NextFunction } from 'express'
import prisma from '../lib/prisma'
import { classifyPolicyPriority, getDaysOverdue, BUCKET_LABEL } from '../services/priority'

const router = Router()

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clientId, policyNumber, type, insurer, expirationDate, premium } = req.body
    if (!clientId || !insurer || !expirationDate) {
      return res.status(400).json({ error: 'clientId, insurer y expirationDate son requeridos' })
    }
    const policy = await prisma.policy.create({
      data: {
        clientId,
        policyNumber: policyNumber?.trim() || null,
        type: type || 'auto',
        insurer: insurer.trim(),
        expirationDate: new Date(expirationDate),
        premium: premium ? Number(premium) : null,
      },
      include: { client: true },
    })
    return res.status(201).json(policy)
  } catch (err) {
    return next(err)
  }
})

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const policy = await prisma.policy.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        actions: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!policy) return res.status(404).json({ error: 'Póliza no encontrada' })

    const bucket = classifyPolicyPriority(policy.expirationDate)
    return res.json({
      ...policy,
      priorityBucket: bucket,
      priorityLabel: BUCKET_LABEL[bucket],
      daysOverdue: getDaysOverdue(policy.expirationDate),
    })
  } catch (err) {
    return next(err)
  }
})

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { policyNumber, type, insurer, expirationDate, premium, status } = req.body
    const policy = await prisma.policy.update({
      where: { id: req.params.id },
      data: {
        ...(policyNumber !== undefined && { policyNumber: policyNumber?.trim() || null }),
        ...(type !== undefined && { type }),
        ...(insurer !== undefined && { insurer: insurer.trim() }),
        ...(expirationDate !== undefined && { expirationDate: new Date(expirationDate) }),
        ...(premium !== undefined && { premium: premium ? Number(premium) : null }),
        ...(status !== undefined && { status }),
      },
    })
    return res.json(policy)
  } catch (err) {
    return next(err)
  }
})

// Register a management action (contact attempt, renewal, etc.)
router.post('/:id/actions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { actionType, notes, newExpirationDate } = req.body
    if (!actionType) return res.status(400).json({ error: 'actionType es requerido' })

    const validTypes = ['llamada', 'whatsapp', 'correo', 'nota', 'renovacion', 'perdida']
    if (!validTypes.includes(actionType)) {
      return res.status(400).json({ error: `actionType debe ser uno de: ${validTypes.join(', ')}` })
    }

    const action = await prisma.managementAction.create({
      data: {
        policyId: req.params.id,
        actionType,
        notes: notes?.trim() || null,
        newExpirationDate: newExpirationDate ? new Date(newExpirationDate) : null,
      },
    })

    // If renewal or marked as lost, update policy status accordingly
    if (actionType === 'renovacion' && newExpirationDate) {
      await prisma.policy.update({
        where: { id: req.params.id },
        data: { status: 'renewed', expirationDate: new Date(newExpirationDate) },
      })
    } else if (actionType === 'perdida') {
      await prisma.policy.update({
        where: { id: req.params.id },
        data: { status: 'lost' },
      })
    }

    return res.status(201).json(action)
  } catch (err) {
    return next(err)
  }
})

router.get('/:id/actions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actions = await prisma.managementAction.findMany({
      where: { policyId: req.params.id },
      orderBy: { createdAt: 'desc' },
    })
    return res.json(actions)
  } catch (err) {
    return next(err)
  }
})

export default router
