import { Response } from 'express'

interface SuccessResponse<T> {
  success: true
  data: T
}

interface ErrorResponse {
  success: false
  error: string
  fields?: Record<string, string[]>
}

export type ApiResponseBody<T> = SuccessResponse<T> | ErrorResponse

export const ApiResponse = {
  ok: <T>(res: Response, data: T) =>
    res.status(200).json({ success: true, data } satisfies SuccessResponse<T>),

  created: <T>(res: Response, data: T) =>
    res.status(201).json({ success: true, data } satisfies SuccessResponse<T>),

  notFound: (res: Response, message = 'Recurso no encontrado') =>
    res.status(404).json({ success: false, error: message } satisfies ErrorResponse),

  badRequest: (res: Response, message: string, fields?: Record<string, string[]>) =>
    res.status(400).json({ success: false, error: message, ...(fields && { fields }) } satisfies ErrorResponse),

  serverError: (res: Response, message = 'Error interno del servidor') =>
    res.status(500).json({ success: false, error: message } satisfies ErrorResponse),
}
