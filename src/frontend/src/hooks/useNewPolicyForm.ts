import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createPolicy, getClients } from '../api/client'
import { useFormReset } from './useFormReset'

interface UseNewPolicyFormProps {
  onClose: () => void
}

export function useNewPolicyForm({ onClose }: UseNewPolicyFormProps) {
  const [clientId, setClientId] = useState<string>('')
  const [policyNumber, setPolicyNumber] = useState<string>('')
  const [type, setType] = useState<string>('auto')
  const [insurer, setInsurer] = useState<string>('')
  const [expirationDate, setExpirationDate] = useState<string>('')
  const [premium, setPremium] = useState<string>('')

  const reset = useFormReset([
    [setClientId, ''],
    [setPolicyNumber, ''],
    [setType, 'auto'],
    [setInsurer, ''],
    [setExpirationDate, ''],
    [setPremium, ''],
  ])

  const qc = useQueryClient()

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => getClients(),
  })

  const mutation = useMutation({
    mutationFn: () =>
      createPolicy({
        clientId,
        policyNumber: policyNumber || undefined,
        type,
        insurer,
        expirationDate,
        premium: premium ? Number(premium) : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workload'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      handleClose()
    },
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const isValid: boolean = Boolean(clientId && insurer && expirationDate)

  return {
    fields: { clientId, policyNumber, type, insurer, expirationDate, premium },
    setters: { setClientId, setPolicyNumber, setType, setInsurer, setExpirationDate, setPremium },
    clients,
    mutation,
    handleClose,
    isValid,
  }
}
