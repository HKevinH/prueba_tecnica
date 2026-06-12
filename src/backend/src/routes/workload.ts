import { Router, Request, Response, NextFunction } from 'express'
import prisma from '../lib/prisma'
import {
  classifyPolicyPriority,
  getDaysOverdue,
  BUCKET_PRIORITY,
  BUCKET_LABEL,
  PriorityBucket,
} from '../services/priority'
import { ApiResponse } from '../lib/apiResponse'
import { PolicyStatus } from '../constants'

const router = Router()

// Returns all policies that need attention, sorted by priority.
// Excludes renewed, lost, and active (30+ days out).
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bucket, search } = req.query

    const policies = await prisma.policy.findMany({
      where: {
        status: { notIn: [PolicyStatus.RENEWED, PolicyStatus.LOST] },
        client: search
          ? { name: { contains: String(search) } }
          : undefined,
      },
      include: {
        client: { select: { id: true, name: true, phone: true, email: true } },
        actions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { actionType: true, notes: true, createdAt: true },
        },
        _count: { select: { actions: true } },
      },
    })

    const today = new Date()

    const enriched = policies
      .map((p) => {
        const priorityBucket: PriorityBucket = classifyPolicyPriority(p.expirationDate, today)
        const daysOverdue = getDaysOverdue(p.expirationDate, today)
        return {
          id: p.id,
          policyNumber: p.policyNumber,
          type: p.type,
          insurer: p.insurer,
          expirationDate: p.expirationDate,
          premium: p.premium,
          status: p.status,
          priorityBucket,
          priorityLabel: BUCKET_LABEL[priorityBucket],
          daysOverdue,
          client: p.client,
          lastAction: p.actions[0] ?? null,
          contactCount: p._count.actions,
        }
      })
      .filter((p) => {
        if (bucket && p.priorityBucket !== bucket) return false
        return p.priorityBucket !== PolicyStatus.ACTIVE
      })
      .sort((a, b) => BUCKET_PRIORITY[a.priorityBucket] - BUCKET_PRIORITY[b.priorityBucket])

    ApiResponse.ok(res, enriched)
  } catch (err) {
    next(err)
  }
})

export default router
