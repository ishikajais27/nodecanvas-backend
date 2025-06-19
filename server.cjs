const express = require('express')
const cors = require('cors')
const path = require('path')
const apiRouter = require('./routes/api.cjs')

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// API routes
app.use('/api', apiRouter)

// Serve static files from frontend in production
// if (process.env.NODE_ENV === 'production') {
//   // Resolve the correct path to frontend dist
//   const frontendPath = path.join(__dirname, '../frontend/dist')

//   // Serve static files
//   app.use(express.static(frontendPath))

//   // Handle SPA routing - return index.html for all unknown routes
//   app.get('*', (req, res) => {
//     res.sendFile(path.join(frontendPath, 'index.html'))
//   })
// }

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
