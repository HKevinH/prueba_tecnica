import express from 'express'
import cors from 'cors'
import 'dotenv/config'

import dashboardRouter from './routes/dashboard'
import workloadRouter from './routes/workload'
import clientsRouter from './routes/clients'
import policiesRouter from './routes/policies'
import { notFound, errorHandler } from './middleware/errorHandler'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api/dashboard', dashboardRouter)
app.use('/api/workload', workloadRouter)
app.use('/api/clients', clientsRouter)
app.use('/api/policies', policiesRouter)

app.use(notFound)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`)
})

export default app
