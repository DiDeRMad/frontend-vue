export const securityConfig = {
    jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
        expiresIn: process.env.JWT_EXPIRE || '7d',
        algorithm: 'HS256',
        issuer: 'eternal-realms',
        audience: 'eternal-realms-players'
    },
    bcrypt: {
        saltRounds: 12
    },
    session: {
        secret: process.env.SESSION_SECRET || 'your-session-secret',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            sameSite: 'strict'
        }
    },
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Game-Version'],
        exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
        maxAge: 86400 // 24 hours
    },
    helmet: {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
                imgSrc: ["'self'", 'data:', 'https:'],
                fontSrc: ["'self'", 'https://fonts.gstatic.com'],
                connectSrc: ["'self'", 'wss:', 'https:'],
                mediaSrc: ["'self'"],
                objectSrc: ["'none'"],
                frameSrc: ["'self'"],
                workerSrc: ["'self'", 'blob:'],
                childSrc: ["'self'", 'blob:'],
                formAction: ["'self'"],
                frameAncestors: ["'none'"],
                baseUri: ["'self'"],
                manifestSrc: ["'self'"]
            }
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    },
    rateLimit: {
        general: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100,
            message: 'Too many requests from this IP, please try again later.',
            standardHeaders: true,
            legacyHeaders: false
        },
        auth: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5,
            skipSuccessfulRequests: true
        },
        api: {
            windowMs: 1 * 60 * 1000, // 1 minute
            max: 60
        },
        websocket: {
            windowMs: 1 * 60 * 1000, // 1 minute
            max: 120,
            perConnection: true
        }
    },
    encryption: {
        algorithm: 'aes-256-gcm',
        key: process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key',
        ivLength: 16,
        tagLength: 16,
        saltLength: 64
    },
    oauth: {
        google: {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/api/auth/google/callback'
        },
        facebook: {
            clientID: process.env.FACEBOOK_APP_ID,
            clientSecret: process.env.FACEBOOK_APP_SECRET,
            callbackURL: '/api/auth/facebook/callback',
            profileFields: ['id', 'emails', 'name', 'picture.type(large)']
        },
        discord: {
            clientID: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
            callbackURL: '/api/auth/discord/callback',
            scope: ['identify', 'email']
        }
    },
    twoFactor: {
        issuer: 'Eternal Realms Online',
        window: 2,
        step: 30,
        digits: 6,
        algorithm: 'sha1'
    },
    passwordPolicy: {
        minLength: 8,
        maxLength: 128,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
        preventCommon: true,
        preventUserInfo: true
    },
    ipWhitelist: process.env.IP_WHITELIST ? process.env.IP_WHITELIST.split(',') : [],
    ipBlacklist: process.env.IP_BLACKLIST ? process.env.IP_BLACKLIST.split(',') : [],
    maxLoginAttempts: 5,
    lockoutDuration: 30 * 60 * 1000, // 30 minutes
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    rememberMeDuration: 30 * 24 * 60 * 60 * 1000 // 30 days
};