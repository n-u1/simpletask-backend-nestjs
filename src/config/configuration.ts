export default (): {
  app: {
    name: string;
    version: string;
    environment: string;
    port: number;
    apiPrefix: string;
  };
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    name: string;
    poolSize: number;
    maxOverflow: number;
    ssl: boolean;
  };
  redis: {
    host: string;
    port: number;
    password: string;
    db: number;
    poolSize: number;
    healthCheckInterval: number;
    socketTimeout: number;
  };
  jwt: {
    secret: string;
    algorithm: string;
    accessTokenExpire: number;
    refreshTokenExpire: number;
  };
  argon2: {
    timeCost: number;
    memoryCost: number;
    parallelism: number;
    hashLength: number;
    saltLength: number;
  };
  security: {
    rateLimitPerMinute: number;
    loginRateLimitPerMinute: number;
    corsOrigins: string;
  };
  logging: {
    level: string;
    enableDebug: boolean;
  };
} => ({
  app: {
    name: process.env.APP_NAME ?? 'SimpleTask API',
    version: process.env.APP_VERSION ?? '0.1.0',
    environment: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '8000', 10),
    apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  },
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? '',
    name: process.env.DB_NAME ?? 'simpletask',
    poolSize: parseInt(process.env.DB_POOL_SIZE ?? '5', 10),
    maxOverflow: parseInt(process.env.DB_MAX_OVERFLOW ?? '10', 10),
    ssl: process.env.NODE_ENV === 'production',
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD ?? '',
    db: parseInt(process.env.REDIS_DB ?? '0', 10),
    poolSize: parseInt(process.env.REDIS_POOL_SIZE ?? '5', 10),
    healthCheckInterval: parseInt(process.env.REDIS_HEALTH_CHECK_INTERVAL ?? '30', 10),
    socketTimeout: parseInt(
      (process.env.NODE_ENV === 'production'
        ? process.env.REDIS_SOCKET_TIMEOUT_PROD
        : process.env.REDIS_SOCKET_TIMEOUT_DEV) ?? '5',
      10,
    ),
  },
  jwt: {
    secret: process.env.JWT_SECRET_KEY ?? '',
    algorithm: process.env.JWT_ALGORITHM ?? 'HS256',
    accessTokenExpire: parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRE_MINUTES ?? '30', 10),
    refreshTokenExpire: parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRE_DAYS ?? '30', 10),
  },
  argon2: {
    timeCost: parseInt(process.env.ARGON2_TIME_COST ?? '3', 10),
    memoryCost: parseInt(process.env.ARGON2_MEMORY_COST ?? '65536', 10),
    parallelism: parseInt(process.env.ARGON2_PARALLELISM ?? '1', 10),
    hashLength: parseInt(process.env.ARGON2_HASH_LENGTH ?? '32', 10),
    saltLength: parseInt(process.env.ARGON2_SALT_LENGTH ?? '16', 10),
  },
  security: {
    rateLimitPerMinute: parseInt(process.env.RATE_LIMIT_PER_MINUTE ?? '60', 10),
    loginRateLimitPerMinute: parseInt(process.env.LOGIN_RATE_LIMIT_PER_MINUTE ?? '5', 10),
    corsOrigins: process.env.BACKEND_CORS_ORIGINS ?? 'http://localhost:3000',
  },
  logging: {
    level: process.env.LOG_LEVEL ?? 'info',
    enableDebug: process.env.DEBUG === 'true',
  },
});
