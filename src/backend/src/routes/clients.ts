import { Router, Request, Response, NextFunction } from 'express'
import prisma from '../lib/prisma'
import { validate } from '../middleware/validate'
import { createClientSchema, updateClientSchema, CreateClientInput, UpdateClientInput } from '../schemas'
import { ApiResponse } from '../lib/apiResponse'

const router = Router()

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query
    const clients = await prisma.client.findMany({
      where: search ? { name: { contains: String(search) } } : undefined,
      orderBy: { name: 'asc' },
      include: { _count: { select: { policies: true } } },
    })
    ApiResponse.ok(res, clients)
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        policies: {
          orderBy: { expirationDate: 'asc' },
          include: { _count: { select: { actions: true } } },
        },
      },
    })
    if (!client) return ApiResponse.notFound(res, 'Cliente no encontrado')
    return ApiResponse.ok(res, client)
  } catch (err) {
    return next(err)
  }
})

router.post('/', validate(createClientSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, phone, email } = req.body as CreateClientInput
    const client = await prisma.client.create({
      data: { name: name.trim(), phone: phone?.trim() || null, email: email?.trim() || null },
    })
    return ApiResponse.created(res, client)
  } catch (err) {
    return next(err)
  }
})

router.put('/:id', validate(updateClientSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, phone, email } = req.body as UpdateClientInput
    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(email !== undefined && { email: email?.trim() || null }),
      },
    })
    return ApiResponse.ok(res, client)
  } catch (err) {
    return next(err)
  }
})

export default router
