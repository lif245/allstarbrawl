const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const path = require('path')
const { GameStateManager } = require('./gameState')

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST']
  }
})

const PORT = process.env.PORT || 3001
const gameState = new GameStateManager()

// Serve static files in production
app.use(express.json())
app.use(express.static(path.join(__dirname, '../dist')))

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    game: 'All Star Battle',
    rooms: gameState.rooms.size,
    timestamp: new Date().toISOString()
  })
})

app.get('/api/leaderboard', (req, res) => {
  const room = gameState.getOrCreateRoom('default')
  res.json(room.getLeaderboard())
})

app.get('/api/rooms', (req, res) => {
  const rooms = Array.from(gameState.rooms.entries()).map(([id, room]) => ({
    id,
    playerCount: room.players.size,
    maxPlayers: room.maxPlayers
  }))
  res.json(rooms)
})

// Socket.io Events
io.on('connection', (socket) => {
  console.log(`[+] Player connected: ${socket.id}`)
  
  // Join game room
  socket.on('join', (data) => {
    const roomId = data.roomId || 'default'
    const room = gameState.joinRoom(socket.id, roomId, {
      name: data.name || `Player_${socket.id.substring(0,4)}`,
      character: data.character || 'kage'
    })
    
    if (!room) {
      socket.emit('joinError', { message: 'Room is full' })
      return
    }
    
    socket.join(roomId)
    socket.emit('joined', { 
      roomId, 
      playerId: socket.id,
      state: room.getState()
    })
    
    // Notify others
    socket.to(roomId).emit('playerJoined', {
      id: socket.id,
      ...room.players.get(socket.id)
    })
    
    console.log(`[>] ${socket.id} joined room: ${roomId} (${room.players.size} players)`)
  })
  
  // Player movement sync
  socket.on('playerUpdate', (data) => {
    const roomId = gameState.playerRooms.get(socket.id)
    if (!roomId) return
    
    gameState.updatePlayerState(socket.id, {
      x: data.x,
      y: data.y,
      rotation: data.rotation,
      hp: data.hp
    })
    
    // Broadcast to other players in room (not sender)
    socket.to(roomId).emit('playerMoved', {
      id: socket.id,
      x: data.x,
      y: data.y,
      rotation: data.rotation,
      hp: data.hp
    })
  })
  
  // Player shoot
  socket.on('playerShoot', (data) => {
    const roomId = gameState.playerRooms.get(socket.id)
    if (!roomId) return
    socket.to(roomId).emit('bulletFired', {
      playerId: socket.id,
      x: data.x,
      y: data.y,
      angle: data.angle
    })
  })
  
  // Player killed enemy
  socket.on('enemyKilled', (data) => {
    const room = gameState.getPlayerRoom(socket.id)
    if (!room) return
    
    const player = room.players.get(socket.id)
    if (player) {
      player.kills++
      player.score += data.xpReward || 20
    }
    
    // Broadcast leaderboard update every 5 kills
    if (player && player.kills % 5 === 0) {
      const roomId = gameState.playerRooms.get(socket.id)
      io.to(roomId).emit('leaderboardUpdate', room.getLeaderboard())
    }
  })
  
  // Player died
  socket.on('playerDied', () => {
    const room = gameState.getPlayerRoom(socket.id)
    if (room) {
      const player = room.players.get(socket.id)
      if (player) player.alive = false
      
      const roomId = gameState.playerRooms.get(socket.id)
      socket.to(roomId).emit('playerDied', { id: socket.id })
    }
  })
  
  // Chat message
  socket.on('chat', (data) => {
    const roomId = gameState.playerRooms.get(socket.id)
    if (!roomId) return
    
    const room = gameState.getPlayerRoom(socket.id)
    const player = room?.players.get(socket.id)
    
    io.to(roomId).emit('chatMessage', {
      playerId: socket.id,
      name: player?.name || 'Unknown',
      message: data.message?.substring(0, 100) // limit message length
    })
  })
  
  // Disconnect
  socket.on('disconnect', (reason) => {
    const roomId = gameState.playerRooms.get(socket.id)
    
    if (roomId) {
      socket.to(roomId).emit('playerLeft', { id: socket.id })
    }
    
    gameState.leaveRoom(socket.id)
    console.log(`[-] Player disconnected: ${socket.id} (${reason})`)
  })
})

// Periodic leaderboard broadcast (every 30 seconds)
setInterval(() => {
  gameState.rooms.forEach((room, roomId) => {
    if (room.players.size > 0) {
      io.to(roomId).emit('leaderboardUpdate', room.getLeaderboard())
    }
  })
}, 30000)

httpServer.listen(PORT, () => {
  console.log(`🎮 All Star Battle Server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
  console.log(`🏆 Leaderboard: http://localhost:${PORT}/api/leaderboard`)
})

module.exports = { app, io }
