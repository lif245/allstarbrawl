// Game State Manager
// จัดการ state ของเกมทุก room

const TICK_RATE = 20 // 20 updates per second

class GameRoom {
  constructor(roomId) {
    this.roomId = roomId
    this.players = new Map() // socketId -> playerState
    this.enemies = []
    this.bullets = []
    this.score = {}
    this.started = false
    this.maxPlayers = 10
  }
  
  addPlayer(socketId, data) {
    this.players.set(socketId, {
      id: socketId,
      name: data.name || 'Player',
      character: data.character || 'kage',
      x: 1500 + Math.random() * 200 - 100,
      y: 1500 + Math.random() * 200 - 100,
      hp: 100,
      maxHP: 100,
      score: 0,
      kills: 0,
      alive: true,
      lastUpdate: Date.now()
    })
    this.score[socketId] = 0
  }
  
  removePlayer(socketId) {
    this.players.delete(socketId)
    delete this.score[socketId]
  }
  
  updatePlayer(socketId, data) {
    const player = this.players.get(socketId)
    if (!player) return
    Object.assign(player, data, { lastUpdate: Date.now() })
  }
  
  getLeaderboard() {
    return Array.from(this.players.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(p => ({ name: p.name, score: p.score, kills: p.kills, character: p.character }))
  }
  
  getState() {
    return {
      players: Array.from(this.players.values()),
      playerCount: this.players.size
    }
  }
}

class GameStateManager {
  constructor() {
    this.rooms = new Map()
    this.playerRooms = new Map() // socketId -> roomId
  }
  
  getOrCreateRoom(roomId = 'default') {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new GameRoom(roomId))
    }
    return this.rooms.get(roomId)
  }
  
  joinRoom(socketId, roomId, playerData) {
    const room = this.getOrCreateRoom(roomId)
    if (room.players.size >= room.maxPlayers) return null
    
    room.addPlayer(socketId, playerData)
    this.playerRooms.set(socketId, roomId)
    return room
  }
  
  leaveRoom(socketId) {
    const roomId = this.playerRooms.get(socketId)
    if (!roomId) return
    
    const room = this.rooms.get(roomId)
    if (room) {
      room.removePlayer(socketId)
      if (room.players.size === 0) {
        this.rooms.delete(roomId)
      }
    }
    this.playerRooms.delete(socketId)
  }
  
  getPlayerRoom(socketId) {
    const roomId = this.playerRooms.get(socketId)
    if (!roomId) return null
    return this.rooms.get(roomId)
  }
  
  updatePlayerState(socketId, data) {
    const room = this.getPlayerRoom(socketId)
    if (room) room.updatePlayer(socketId, data)
  }
}

module.exports = { GameStateManager }
