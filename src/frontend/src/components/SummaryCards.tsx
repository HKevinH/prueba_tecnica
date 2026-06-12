import { Box, Card, CardContent, Typography, Skeleton } from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ErrorIcon from '@mui/icons-material/Error'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import { DashboardStats } from '../types'

interface Props {
  stats: DashboardStats | undefined
  loading: boolean
  activeBucket: string
  onBucketClick: (bucket: string) => void
}

const cards = [
  {
    key: 'expires_today',
    label: 'Vence hoy',
    color: '#D32F2F',
    bg: '#FFEBEE',
    icon: <ErrorIcon sx={{ color: '#D32F2F' }} />,
  },
  {
    key: 'critical_window',
    label: 'Ventana crítica',
    sublabel: 'Venció 1–30 días',
    color: '#E65100',
    bg: '#FFF3E0',
    icon: <WarningAmberIcon sx={{ color: '#E65100' }} />,
  },
  {
    key: 'expiring_soon',
    label: 'Por vencer',
    sublabel: 'Vence en 1–30 días',
    color: '#F57F17',
    bg: '#FFFDE7',
    icon: <AccessTimeIcon sx={{ color: '#F57F17' }} />,
  },
  {
    key: 'outside_window',
    label: 'Fuera de ventana',
    sublabel: 'Venció hace 30+ días',
    color: '#616161',
    bg: '#F5F5F5',
    icon: <HelpOutlineIcon sx={{ color: '#616161' }} />,
  },
  {
    key: 'renewed',
    label: 'Renovadas',
    color: '#2E7D32',
    bg: '#E8F5E9',
    icon: <CheckCircleIcon sx={{ color: '#2E7D32' }} />,
  },
]

export default function SummaryCards({ stats, loading, activeBucket, onBucketClick }: Props) {
  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
      {cards.map((c) => {
        const value = stats ? (stats[c.key as keyof DashboardStats] as number) : 0
        const isActive = activeBucket === c.key
        return (
          <Card
            key={c.key}
            onClick={() => onBucketClick(isActive ? '' : c.key)}
            sx={{
              minWidth: 160,
              flex: '1 1 160px',
              cursor: 'pointer',
              border: isActive ? `2px solid ${c.color}` : '2px solid transparent',
              bgcolor: c.bg,
              transition: 'transform .15s',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
            }}
          >
            <CardContent sx={{ pb: '12px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                {c.icon}
                {loading ? (
                  <Skeleton width={32} height={36} />
                ) : (
                  <Typography variant="h4" fontWeight={700} color={c.color}>
                    {value}
                  </Typography>
                )}
              </Box>
              <Typography variant="body2" fontWeight={600} color={c.color}>
                {c.label}
              </Typography>
              {c.sublabel && (
                <Typography variant="caption" color="text.secondary">
                  {c.sublabel}
                </Typography>
              )}
            </CardContent>
          </Card>
        )
      })}
    </Box>
  )
}
