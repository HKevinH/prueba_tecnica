import { Router, Request, Response, NextFunction } from 'express'
import prisma from '../lib/prisma'

const router = Router()

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query
    const clients = await prisma.client.findMany({
      where: search
        ? { name: { contains: String(search) } }
        : undefined,
      orderBy: { name: 'asc' },
      include: { _count: { select: { policies: true } } },
    })
    res.json(clients)
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
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' })
    return res.json(client)
  } catch (err) {
    return next(err)
  }
})

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, phone, email } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'El nombre es requerido' })
    const client = await prisma.client.create({
      data: { name: name.trim(), phone: phone?.trim() || null, email: email?.trim() || null },
    })
    return res.status(201).json(client)
  } catch (err) {
    return next(err)
  }
})

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, phone, email } = req.body
    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(email !== undefined && { email: email?.trim() || null }),
      },
    })
    return res.json(client)
  } catch (err) {
    return next(err)
  }
})

export default router
