const express = require('express')
const fs = require('fs')
const path = require('path')
const cors = require('cors')

const router = express.Router()
const dataPath = path.join(__dirname, '../db/data.json')

// Enhanced logging middleware
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`)
  next()
})

// Helper function to read data with error handling
const readData = () => {
  try {
    if (!fs.existsSync(dataPath)) {
      fs.writeFileSync(dataPath, JSON.stringify({ nodes: [], edges: [] }))
    }
    const rawData = fs.readFileSync(dataPath, 'utf8')
    return JSON.parse(rawData)
  } catch (error) {
    console.error('Error reading data file:', error)
    throw new Error('Failed to read data file')
  }
}

// Helper function to write data with error handling
const writeData = (data) => {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8')
  } catch (error) {
    console.error('Error writing data file:', error)
    throw new Error('Failed to write data file')
  }
}

// Get all graph data
router.get('/graph', (req, res) => {
  try {
    const data = readData()
    res.json(data)
  } catch (error) {
    console.error('Error reading graph data:', error)
    res.status(500).json({
      error: 'Failed to read graph data',
      details: error.message,
    })
  }
})

// Add a new node
router.post('/nodes', (req, res) => {
  try {
    const data = readData()
    const newNode = {
      id:
        req.body.id ||
        `service-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: req.body.name || `Service ${Math.floor(Math.random() * 1000)}`,
      type:
        req.body.type ||
        ['backend', 'frontend', 'database', 'gateway'][
          Math.floor(Math.random() * 4)
        ],
      latency: req.body.latency || Math.floor(Math.random() * 200),
      errorRate: req.body.errorRate || Math.random().toFixed(2),
      traffic: req.body.traffic || Math.floor(Math.random() * 50),
      x: req.body.x || Math.random() * 800 - 400,
      y: req.body.y || Math.random() * 800 - 400,
    }

    data.nodes.push(newNode)
    writeData(data)
    res.status(201).json(newNode)
  } catch (error) {
    console.error('Error adding node:', error)
    res.status(500).json({
      error: 'Failed to add node',
      details: error.message,
    })
  }
})

// Update a node
router.put('/nodes/:id', (req, res) => {
  try {
    const data = readData()
    const nodeId = req.params.id
    const updatedNode = req.body

    const index = data.nodes.findIndex((node) => node.id === nodeId)
    if (index === -1) {
      return res.status(404).json({
        error: 'Node not found',
        nodeId,
      })
    }

    data.nodes[index] = { ...data.nodes[index], ...updatedNode }
    writeData(data)
    res.json(data.nodes[index])
  } catch (error) {
    console.error('Error updating node:', error)
    res.status(500).json({
      error: 'Failed to update node',
      details: error.message,
    })
  }
})

// Delete a node
router.delete('/nodes/:id', (req, res) => {
  try {
    const data = readData()
    const nodeId = req.params.id

    const nodeExists = data.nodes.some((node) => node.id === nodeId)
    if (!nodeExists) {
      return res.status(404).json({
        error: 'Node not found',
        nodeId,
      })
    }

    data.nodes = data.nodes.filter((node) => node.id !== nodeId)
    data.edges = data.edges.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId
    )

    writeData(data)
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting node:', error)
    res.status(500).json({
      error: 'Failed to delete node',
      details: error.message,
    })
  }
})

// Add an edge
router.post('/edges', (req, res) => {
  try {
    const data = readData()
    const newEdge = req.body

    const sourceExists = data.nodes.some((node) => node.id === newEdge.source)
    const targetExists = data.nodes.some((node) => node.id === newEdge.target)

    if (!sourceExists || !targetExists) {
      return res.status(400).json({
        error: 'Source or target node does not exist',
        source: newEdge.source,
        target: newEdge.target,
      })
    }

    const edgeExists = data.edges.some(
      (edge) => edge.source === newEdge.source && edge.target === newEdge.target
    )

    if (edgeExists) {
      return res.status(400).json({
        error: 'Edge already exists',
        source: newEdge.source,
        target: newEdge.target,
      })
    }

    const edgeWithDefaults = {
      ...newEdge,
      id:
        newEdge.id || `edge-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      traffic: newEdge.traffic || Math.floor(Math.random() * 50) + 1,
      protocol: newEdge.protocol || 'HTTP',
      errorRate: newEdge.errorRate || Math.random().toFixed(2),
      rps: newEdge.rps || Math.floor(Math.random() * 1000),
    }

    data.edges.push(edgeWithDefaults)
    writeData(data)
    res.status(201).json(edgeWithDefaults)
  } catch (error) {
    console.error('Error adding edge:', error)
    res.status(500).json({
      error: 'Failed to add edge',
      details: error.message,
    })
  }
})

// Delete an edge
router.delete('/edges', (req, res) => {
  try {
    const data = readData()
    const { source, target } = req.body

    const edgeExists = data.edges.some(
      (edge) => edge.source === source && edge.target === target
    )

    if (!edgeExists) {
      return res.status(404).json({
        error: 'Edge not found',
        source,
        target,
      })
    }

    data.edges = data.edges.filter(
      (edge) => !(edge.source === source && edge.target === target)
    )

    writeData(data)
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting edge:', error)
    res.status(500).json({
      error: 'Failed to delete edge',
      details: error.message,
    })
  }
})

// Search nodes by name
router.get('/nodes/search', (req, res) => {
  try {
    const data = readData()
    const query = req.query.q?.toLowerCase() || ''

    if (!query.trim()) {
      return res.status(400).json({
        error: 'Search query is required',
      })
    }

    const filteredNodes = data.nodes.filter((node) =>
      node.name.toLowerCase().includes(query)
    )

    res.json(filteredNodes)
  } catch (error) {
    console.error('Error searching nodes:', error)
    res.status(500).json({
      error: 'Failed to search nodes',
      details: error.message,
    })
  }
})

// Filter nodes by type
router.get('/nodes/filter', (req, res) => {
  try {
    const data = readData()
    const type = req.query.type?.toLowerCase() || ''

    if (!type.trim()) {
      return res.status(400).json({
        error: 'Type parameter is required',
      })
    }

    const filteredNodes = data.nodes.filter(
      (node) => node.type?.toLowerCase() === type
    )

    res.json(filteredNodes)
  } catch (error) {
    console.error('Error filtering nodes:', error)
    res.status(500).json({
      error: 'Failed to filter nodes',
      details: error.message,
    })
  }
})

// Health check endpoint
router.get('/health', (req, res) => {
  try {
    readData() // Verify we can read the data file
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    })
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
    })
  }
})

module.exports = router
