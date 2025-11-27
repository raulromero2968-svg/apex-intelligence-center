/**
 * API Configuration
 * Centralized configuration for all backend integrations
 */

export const API_CONFIG = {
  // Base URLs
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.apex-intelligence.io',

  // Price Data APIs
  priceAPIs: {
    tcgplayer: {
      baseUrl: 'https://api.tcgplayer.com/v1.39.0',
      publicKey: process.env.TCGPLAYER_PUBLIC_KEY || '',
      privateKey: process.env.TCGPLAYER_PRIVATE_KEY || '',
    },
    ebay: {
      baseUrl: 'https://api.ebay.com/buy/browse/v1',
      appId: process.env.EBAY_APP_ID || '',
      certId: process.env.EBAY_CERT_ID || '',
    },
    // Fallback to mock data in development
    useMockData: process.env.NODE_ENV === 'development',
  },

  // Authentication
  auth: {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    sessionExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  },

  // Rate Limiting
  rateLimit: {
    maxRequestsPerMinute: 60,
    maxRequestsPerHour: 1000,
  },

  // Cache Configuration
  cache: {
    priceDataTTL: 5 * 60 * 1000, // 5 minutes
    marketDataTTL: 15 * 60 * 1000, // 15 minutes
    userDataTTL: 60 * 1000, // 1 minute
  },

  // Feature Flags
  features: {
    realTimePrices: process.env.NEXT_PUBLIC_ENABLE_REAL_TIME_PRICES === 'true',
    priceAlerts: process.env.NEXT_PUBLIC_ENABLE_PRICE_ALERTS === 'true',
    portfolioSync: process.env.NEXT_PUBLIC_ENABLE_PORTFOLIO_SYNC === 'true',
  },
};

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Price Data
  prices: {
    search: '/prices/search',
    card: (cardId: string) => `/prices/card/${cardId}`,
    history: (cardId: string) => `/prices/history/${cardId}`,
    batch: '/prices/batch',
  },

  // Portfolio
  portfolio: {
    list: '/portfolio',
    create: '/portfolio',
    update: (id: string) => `/portfolio/${id}`,
    delete: (id: string) => `/portfolio/${id}`,
    export: '/portfolio/export',
    import: '/portfolio/import',
  },

  // Alerts
  alerts: {
    list: '/alerts',
    create: '/alerts',
    update: (id: string) => `/alerts/${id}`,
    delete: (id: string) => `/alerts/${id}`,
    trigger: '/alerts/trigger',
  },

  // User
  user: {
    profile: '/user/profile',
    subscription: '/user/subscription',
    preferences: '/user/preferences',
  },

  // Analytics
  analytics: {
    track: '/analytics/track',
    export: '/analytics/export',
  },
};

/**
 * HTTP Headers
 */
export const getAuthHeaders = (token?: string) => ({
  'Content-Type': 'application/json',
  ...(token && { Authorization: `Bearer ${token}` }),
});

/**
 * Error Messages
 */
export const API_ERRORS = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Unauthorized. Please log in again.',
  FORBIDDEN: 'Access denied. Upgrade to premium for this feature.',
  NOT_FOUND: 'Resource not found.',
  RATE_LIMIT: 'Too many requests. Please try again later.',
  SERVER_ERROR: 'Server error. Please try again later.',
  INVALID_REQUEST: 'Invalid request. Please check your input.',
};
