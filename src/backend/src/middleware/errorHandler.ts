import { Request, Response, NextFunction } from 'express'

export function notFound(req: Request, res: Response) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` })
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  console.error(err.stack)
  res.status(500).json({ error: 'Error interno del servidor', detail: err.message })
}
