const express = require('express')
const fs = require('fs')
const path = require('path')
const cors = require('cors')

const router = express.Router()
const dataPath = path.join(__dirname, '../db/data.json')

// Helper function to read data
const readData = () => {
  const rawData = fs.readFileSync(dataPath)
  return JSON.parse(rawData)
}

// Helper function to write data
const writeData = (data) => {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2))
}

// Enable CORS for all routes
router.use(cors())

// Get all graph data
router.get('/graph', (req, res) => {
  try {
    const data = readData()
    res.json(data)
  } catch (error) {
    console.error('Error reading graph data:', error)
    res.status(500).json({ error: 'Failed to read graph data' })
  }
})

// Add a new node
router.post('/nodes', (req, res) => {
  try {
    const data = readData()
    const newNode = {
      id: req.body.id || `service-${Math.floor(Math.random() * 1000)}`,
      name: req.body.name || `Service ${Math.floor(Math.random() * 1000)}`,
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
    res
      .status(500)
      .json({ error: 'Failed to add node', details: error.message })
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
      return res.status(404).json({ error: 'Node not found' })
    }

    data.nodes[index] = { ...data.nodes[index], ...updatedNode }
    writeData(data)
    res.json(data.nodes[index])
  } catch (error) {
    console.error('Error updating node:', error)
    res
      .status(500)
      .json({ error: 'Failed to update node', details: error.message })
  }
})

// Delete a node
router.delete('/nodes/:id', (req, res) => {
  try {
    const data = readData()
    const nodeId = req.params.id

    // Check if node exists
    const nodeExists = data.nodes.some((node) => node.id === nodeId)
    if (!nodeExists) {
      return res.status(404).json({ error: 'Node not found' })
    }

    // Remove node and related edges
    data.nodes = data.nodes.filter((node) => node.id !== nodeId)
    data.edges = data.edges.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId
    )

    writeData(data)
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting node:', error)
    res
      .status(500)
      .json({ error: 'Failed to delete node', details: error.message })
  }
})

// Add an edge
router.post('/edges', (req, res) => {
  try {
    const data = readData()
    const newEdge = req.body

    // Check if nodes exist
    const sourceExists = data.nodes.some((node) => node.id === newEdge.source)
    const targetExists = data.nodes.some((node) => node.id === newEdge.target)

    if (!sourceExists || !targetExists) {
      return res
        .status(400)
        .json({ error: 'Source or target node does not exist' })
    }

    // Check if edge already exists
    const edgeExists = data.edges.some(
      (edge) => edge.source === newEdge.source && edge.target === newEdge.target
    )

    if (edgeExists) {
      return res.status(400).json({ error: 'Edge already exists' })
    }

    data.edges.push({
      ...newEdge,
      traffic: newEdge.traffic || Math.floor(Math.random() * 50) + 1,
      protocol: newEdge.protocol || 'HTTP',
    })

    writeData(data)
    res.status(201).json(newEdge)
  } catch (error) {
    console.error('Error adding edge:', error)
    res
      .status(500)
      .json({ error: 'Failed to add edge', details: error.message })
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
      return res.status(404).json({ error: 'Edge not found' })
    }

    data.edges = data.edges.filter(
      (edge) => !(edge.source === source && edge.target === target)
    )

    writeData(data)
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting edge:', error)
    res
      .status(500)
      .json({ error: 'Failed to delete edge', details: error.message })
  }
})

// Add these routes before module.exports in api.cjs

// Search nodes by name
router.get('/nodes/search', (req, res) => {
  try {
    const data = readData()
    const query = req.query.q?.toLowerCase() || ''

    const filteredNodes = data.nodes.filter((node) =>
      node.name.toLowerCase().includes(query)
    )

    res.json(filteredNodes)
  } catch (error) {
    console.error('Error searching nodes:', error)
    res.status(500).json({ error: 'Failed to search nodes' })
  }
})

// Filter nodes by type
router.get('/nodes/filter', (req, res) => {
  try {
    const data = readData()
    const type = req.query.type?.toLowerCase() || ''

    const filteredNodes = data.nodes.filter(
      (node) => node.type?.toLowerCase() === type
    )

    res.json(filteredNodes)
  } catch (error) {
    console.error('Error filtering nodes:', error)
    res.status(500).json({ error: 'Failed to filter nodes' })
  }
})

module.exports = router
