import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { initDatabase } from '@api/db/index'
import authRoutes from '@api/routes/auth.js'
import projectRoutes from '@api/routes/projects.js'
import templateRoutes from '@api/routes/templates.js'
import dataRoutes from '@api/routes/data.js'
import layoutRoutes from '@api/routes/layout.js'
import collaborationRoutes from '@api/routes/collaboration.js'
import publicationRoutes from '@api/routes/publications.js'
import analyticsRoutes from '@api/routes/analytics.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

initDatabase()

const app: express.Application = express()

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }),
)

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/templates', templateRoutes)
app.use('/api/projects', dataRoutes)
app.use('/api/projects', layoutRoutes)
app.use('/api/projects', collaborationRoutes)
app.use('/api/projects', publicationRoutes)
app.use('/api', publicationRoutes)
app.use('/api/projects', analyticsRoutes)
app.use('/api', analyticsRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
      timestamp: new Date().toISOString(),
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[API Error]', error)
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? '服务器内部错误' : error.message || 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `API not found: ${req.method} ${req.path}`,
  })
})

export default app
