export const GAME_CONFIG = {
  width: 1280,
  height: 720,
  backgroundColor: '#0a0a0f',

  // Player settings
  player: {
    speed: 220,
    bulletSpeed: 600,
    fireRate: 200, // ms between shots
    maxHP: 100,
    xpToLevel: [0, 100, 250, 450, 700, 1000] // XP needed for each level
  },

  // Enemy settings
  enemy: {
    speed: 80,
    hp: 30,
    xpReward: 20,
    damage: 10,
    spawnInterval: 2000, // ms
    maxEnemies: 20
  },

  // World settings
  world: {
    width: 3000,
    height: 3000
  },

  // Server
  server: {
    port: 3001
  }
}

export const COLORS = {
  primary: 0x8b5cf6,    // purple
  secondary: 0x3b82f6,  // blue
  danger: 0xef4444,     // red
  success: 0x22c55e,    // green
  warning: 0xf59e0b,    // amber
  hp: 0x22c55e,
  mp: 0x3b82f6,
  xp: 0xf59e0b,
  bullet: 0xfbbf24,
  enemy: 0xef4444,
  background: 0x0a0a0f,
  // HUD colors
  panelBg: 0x0a0a1e,
  hpFull:  0x22c55e,    // green when HP > 50%
  hpMid:   0xf59e0b,    // amber when HP 25-50%
  hpLow:   0xef4444,    // red when HP < 25%
  xpFill:  0xfbbf24,    // gold XP bar
}

export const CHARACTERS = [
  {
    id: 'kage',
    name: 'Kage',
    style: 'Ninja / Shadow',
    skill: 'Dash + Clone',
    color: 0x6366f1,
    speed: 270,
    hp: 80,
    icon: '🥷'
  },
  {
    id: 'ryuu',
    name: 'Ryuu',
    style: 'Dragon Warrior',
    skill: 'Fire Breath AOE',
    color: 0xef4444,
    speed: 180,
    hp: 140,
    icon: '🐉'
  },
  {
    id: 'yuki',
    name: 'Yuki',
    style: 'Ice Mage',
    skill: 'Freeze + Slow',
    color: 0x60a5fa,
    speed: 200,
    hp: 90,
    icon: '❄️'
  },
  {
    id: 'raiden',
    name: 'Raiden',
    style: 'Thunder Samurai',
    skill: 'Lightning Strike',
    color: 0xfbbf24,
    speed: 230,
    hp: 110,
    icon: '⚡'
  }
]
