export const wsConfig = {
    pingTimeout: parseInt(process.env.WS_PING_TIMEOUT) || 5000,
    pingInterval: parseInt(process.env.WS_PING_INTERVAL) || 30000,
    maxHttpBufferSize: 100 * 1024 * 1024, // 100 MB
    perMessageDeflate: {
        threshold: 1024,
        zlibDeflateOptions: {
            level: 6,
        },
        zlibInflateOptions: {
            chunkSize: 10 * 1024
        }
    },
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true
    },
    transports: ['websocket', 'polling'],
    
    // Event rate limiting
    eventRateLimits: {
        'movement': { maxPerSecond: 60, burstAllowance: 10 },
        'chat': { maxPerSecond: 2, burstAllowance: 5 },
        'combat': { maxPerSecond: 10, burstAllowance: 5 },
        'inventory': { maxPerSecond: 5, burstAllowance: 3 },
        'social': { maxPerSecond: 3, burstAllowance: 3 },
        'default': { maxPerSecond: 10, burstAllowance: 5 }
    },
    
    // Room settings
    rooms: {
        maxPlayersPerRoom: 200,
        maxRoomsPerServer: 100,
        roomTypes: {
            'world': { maxPlayers: 200, persistent: true },
            'dungeon': { maxPlayers: 50, persistent: false },
            'raid': { maxPlayers: 40, persistent: false },
            'pvp': { maxPlayers: 20, persistent: false },
            'instance': { maxPlayers: 5, persistent: false }
        }
    },
    
    // Message compression
    compression: {
        threshold: 1024, // bytes
        level: 6 // 0-9
    },
    
    // Reconnection settings
    reconnection: {
        enabled: true,
        maxAttempts: 5,
        delay: 1000,
        maxDelay: 5000,
        jitter: 0.5,
        timeout: 20000
    },
    
    // Binary data handling
    binary: {
        enabled: true,
        types: {
            'position': { id: 1, binary: true },
            'combat': { id: 2, binary: true },
            'inventory': { id: 3, binary: false },
            'chat': { id: 4, binary: false }
        }
    }
};