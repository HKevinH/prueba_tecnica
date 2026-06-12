import { useState, useCallback } from 'react'
import {
  Box, Container, Typography, Button, TextField,
  InputAdornment, Tabs, Tab, Alert, Snackbar,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import { useQuery } from '@tanstack/react-query'
import { getDashboard, getWorkload } from './api/client'
import { Policy } from './types'
import SummaryCards from './components/SummaryCards'
import PolicyTable from './components/PolicyTable'
import ActionDialog from './components/ActionDialog'
import NewClientDialog from './components/NewClientDialog'
import NewPolicyDialog from './components/NewPolicyDialog'

const TABS = [
  { value: '', label: 'Todo a gestionar' },
  { value: 'expires_today', label: 'Vencen hoy' },
  { value: 'critical_window', label: 'Ventana crítica' },
  { value: 'expiring_soon', label: 'Por vencer' },
  { value: 'outside_window', label: 'Fuera de ventana' },
]

export default function App() {
  const [activeBucket, setActiveBucket] = useState('')
  const [search, setSearch] = useState('')
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [openNewClient, setOpenNewClient] = useState(false)
  const [openNewPolicy, setOpenNewPolicy] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    refetchInterval: 60_000,
  })

  const { data: policies, isLoading: loadingPolicies } = useQuery({
    queryKey: ['workload', activeBucket, search],
    queryFn: () => getWorkload(activeBucket, search),
  })

  const handleBucketClick = useCallback((bucket: string) => {
    setActiveBucket(bucket)
  }, [])

  const handleAction = useCallback((policy: Policy) => {
    setSelectedPolicy(policy)
  }, [])

  const handleActionClose = useCallback(() => {
    setSelectedPolicy(null)
    setSuccessMsg('Gestión registrada correctamente')
  }, [])

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', pb: 6 }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 2, px: 3, mb: 3, boxShadow: 2 }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Cartera de Pólizas
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                {stats ? `${stats.urgent} pólizas requieren atención urgente` : 'Cargando...'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PersonAddIcon />}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
                onClick={() => setOpenNewClient(true)}
              >
                Nuevo cliente
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
                onClick={() => setOpenNewPolicy(true)}
              >
                Nueva póliza
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl">
        {/* Summary cards */}
        <SummaryCards
          stats={stats}
          loading={loadingStats}
          activeBucket={activeBucket}
          onBucketClick={handleBucketClick}
        />

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Tabs
            value={activeBucket}
            onChange={(_e, v) => setActiveBucket(v)}
            sx={{ minHeight: 40, flex: '1 1 auto' }}
            variant="scrollable"
            scrollButtons="auto"
          >
            {TABS.map((t) => (
              <Tab
                key={t.value}
                value={t.value}
                label={t.label}
                sx={{ minHeight: 40, py: 0 }}
              />
            ))}
          </Tabs>
          <TextField
            size="small"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 240 }}
          />
        </Box>

        {/* Main workload table */}
        <PolicyTable policies={policies} loading={loadingPolicies} onAction={handleAction} />

        {/* Context hint */}
        {stats && stats.critical_window > 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>{stats.critical_window} pólizas</strong> están en ventana crítica. En Colombia, el asesor
            tiene 30 días desde el vencimiento para renovar sin que se trate como nueva contratación.
          </Alert>
        )}
      </Container>

      {/* Dialogs */}
      <ActionDialog policy={selectedPolicy} onClose={handleActionClose} />
      <NewClientDialog open={openNewClient} onClose={() => setOpenNewClient(false)} />
      <NewPolicyDialog open={openNewPolicy} onClose={() => setOpenNewPolicy(false)} />

      <Snackbar
        open={!!successMsg}
        autoHideDuration={3000}
        onClose={() => setSuccessMsg('')}
        message={successMsg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </Box>
  )
}
