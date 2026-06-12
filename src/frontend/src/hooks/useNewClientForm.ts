import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '../api/client'
import { useFormReset } from './useFormReset'

interface UseNewClientFormProps {
  onClose: () => void
}

export function useNewClientForm({ onClose }: UseNewClientFormProps) {
  const [name, setName] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [email, setEmail] = useState<string>('')

  const reset = useFormReset([
    [setName, ''],
    [setPhone, ''],
    [setEmail, ''],
  ])

  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () =>
      createClient({ name, phone: phone || undefined, email: email || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      handleClose()
    },
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const isValid: boolean = Boolean(name.trim())

  return {
    fields: { name, phone, email },
    setters: { setName, setPhone, setEmail },
    mutation,
    handleClose,
    isValid,
  }
}
