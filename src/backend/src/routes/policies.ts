import { Router, Request, Response, NextFunction } from 'express'
import prisma from '../lib/prisma'
import { classifyPolicyPriority, getDaysOverdue, BUCKET_LABEL } from '../services/priority'
import { validate } from '../middleware/validate'
import {
  createPolicySchema, updatePolicySchema, createActionSchema,
  CreatePolicyInput, UpdatePolicyInput, CreateActionInput,
} from '../schemas'
import { ApiResponse } from '../lib/apiResponse'
import { PolicyStatus, ActionType as AT } from '../constants'

const router = Router()

router.post('/', validate(createPolicySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clientId, policyNumber, type, insurer, expirationDate, premium } = req.body as CreatePolicyInput
    const policy = await prisma.policy.create({
      data: {
        clientId,
        policyNumber: policyNumber?.trim() || null,
        type,
        insurer: insurer.trim(),
        expirationDate: new Date(expirationDate),
        premium: premium ?? null,
      },
      include: { client: true },
    })
    return ApiResponse.created(res, policy)
  } catch (err) {
    return next(err)
  }
})

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const policy = await prisma.policy.findUnique({
      where: { id: req.params.id },
      include: { client: true, actions: { orderBy: { createdAt: 'desc' } } },
    })
    if (!policy) return ApiResponse.notFound(res, 'Póliza no encontrada')

    const bucket = classifyPolicyPriority(policy.expirationDate)
    return ApiResponse.ok(res, {
      ...policy,
      priorityBucket: bucket,
      priorityLabel: BUCKET_LABEL[bucket],
      daysOverdue: getDaysOverdue(policy.expirationDate),
    })
  } catch (err) {
    return next(err)
  }
})

router.put('/:id', validate(updatePolicySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { policyNumber, type, insurer, expirationDate, premium, status } = req.body as UpdatePolicyInput
    const policy = await prisma.policy.update({
      where: { id: req.params.id },
      data: {
        ...(policyNumber !== undefined && { policyNumber: policyNumber?.trim() || null }),
        ...(type !== undefined && { type }),
        ...(insurer !== undefined && { insurer: insurer.trim() }),
        ...(expirationDate !== undefined && { expirationDate: new Date(expirationDate) }),
        ...(premium !== undefined && { premium: premium ?? null }),
        ...(status !== undefined && { status }),
      },
    })
    return ApiResponse.ok(res, policy)
  } catch (err) {
    return next(err)
  }
})

router.post('/:id/actions', validate(createActionSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { actionType, notes, newExpirationDate } = req.body as CreateActionInput
    const action = await prisma.managementAction.create({
      data: {
        policyId: req.params.id,
        actionType,
        notes: notes?.trim() || null,
        newExpirationDate: newExpirationDate ? new Date(newExpirationDate) : null,
      },
    })
    if (actionType === AT.RENOVACION && newExpirationDate) {
      await prisma.policy.update({
        where: { id: req.params.id },
        data: { status: PolicyStatus.RENEWED, expirationDate: new Date(newExpirationDate) },
      })
    } else if (actionType === AT.PERDIDA) {
      await prisma.policy.update({ where: { id: req.params.id }, data: { status: PolicyStatus.LOST } })
    }
    return ApiResponse.created(res, action)
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
    return ApiResponse.ok(res, actions)
  } catch (err) {
    return next(err)
  }
})

export default router
