const express = require('express')
const cors = require('cors')
const path = require('path')
const apiRouter = require('./routes/api.cjs')

const app = express() // Initialize app first
const PORT = process.env.PORT || 5000

// CORS configuration
const corsOptions = {
  origin: [
    'https://node-canvas-frontend-qeje.vercel.app/', // Removed trailing slash
    'http://localhost:3000',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}

app.use(cors(corsOptions)) // Now app is defined
app.use(express.json())

// API routes
app.use('/api', apiRouter)

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
