import axios from 'axios'
import { Client, DashboardStats, Policy, ManagementAction, ActionType } from '../types'

const api = axios.create({ baseURL: '/api' })

export const getDashboard = () => api.get<DashboardStats>('/dashboard').then((r) => r.data)

export const getWorkload = (bucket?: string, search?: string) =>
  api
    .get<Policy[]>('/workload', { params: { bucket: bucket || undefined, search: search || undefined } })
    .then((r) => r.data)

export const getClients = (search?: string) =>
  api.get<Client[]>('/clients', { params: { search: search || undefined } }).then((r) => r.data)

export const createClient = (data: { name: string; phone?: string; email?: string }) =>
  api.post<Client>('/clients', data).then((r) => r.data)

export const createPolicy = (data: {
  clientId: string
  policyNumber?: string
  type: string
  insurer: string
  expirationDate: string
  premium?: number
}) => api.post<Policy>('/policies', data).then((r) => r.data)

export const registerAction = (
  policyId: string,
  data: { actionType: ActionType; notes?: string; newExpirationDate?: string },
) => api.post<ManagementAction>(`/policies/${policyId}/actions`, data).then((r) => r.data)
