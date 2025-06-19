const express = require('express')
const cors = require('cors')
const path = require('path')
const apiRouter = require('./routes/api.cjs')
const morgan = require('morgan')

const app = express()
const PORT = process.env.PORT || 5000

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)

    const allowedOrigins = [
      'https://node-canvas-frontend-khm9.vercel.app',
      'https://node-canvas-frontend-yf81-hh7vvst5f-ishikajais27s-projects.vercel.app',
      'http://localhost:3000',
      'http://localhost:5173',
      // Add any other domains you need to allow
    ]

    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    // Also allow subdomains of vercel.app
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true)
    }

    const msg = `The CORS policy for this site does not allow access from ${origin}`
    return callback(new Error(msg), false)
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
}

// Middleware
app.use(cors(corsOptions))
app.use(express.json())
app.use(morgan('combined')) // HTTP request logging

// API routes
app.use('/api', apiRouter)

// Static files (if needed)
app.use(express.static(path.join(__dirname, '../public')))

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack)
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
  })
})

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

module.exports = server
