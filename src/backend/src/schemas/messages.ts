export const ValidationMessages = {
  REQUIRED: '{field} es obligatorio',
  INVALID_EMAIL: '{field} no es un correo electrónico válido',
  INVALID_DATE: '{field} no es una fecha válida',
  POSITIVE_NUMBER: '{field} debe ser mayor a cero',
  MIN_LENGTH: (min: number) => `{field} debe contener al menos ${min} caracteres`,
  ENUM: (values: string[]) => `{field} debe ser uno de: ${values.join(', ')}`,
}

export function vm(message: string, field: string): string {
  return message.replace('{field}', field)
}
