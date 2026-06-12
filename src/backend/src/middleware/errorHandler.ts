import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { ApiResponse } from '../lib/apiResponse'

export function notFound(req: Request, res: Response) {
  ApiResponse.notFound(res, `Ruta no encontrada: ${req.method} ${req.path}`)
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return ApiResponse.badRequest(res, 'Datos inválidos', err.flatten().fieldErrors as Record<string, string[]>)
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2025':
        return ApiResponse.notFound(res, 'El registro no existe o ya fue eliminado')
      case 'P2002':
        return ApiResponse.badRequest(res, 'Ya existe un registro con esos datos')
      case 'P2003':
        return ApiResponse.badRequest(res, 'El recurso referenciado no existe')
      default:
        return ApiResponse.serverError(res, `Error de base de datos: ${err.code}`)
    }
  }

  console.error(err.stack)
  return ApiResponse.serverError(res)
}
