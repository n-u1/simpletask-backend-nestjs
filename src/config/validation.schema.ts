import { z } from 'zod';

export const validationSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  PORT: z.coerce.number().int().min(1).max(65535).default(8000),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),
  DB_POOL_SIZE: z.coerce.number().int().min(1).max(50).default(5),
  DB_MAX_OVERFLOW: z.coerce.number().int().min(0).max(100).default(10),

  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
  REDIS_PASSWORD: z.string().min(1),
  REDIS_DB: z.coerce.number().int().min(0).max(15).default(0),
  REDIS_POOL_SIZE: z.coerce.number().int().min(1).max(100).default(5),

  JWT_SECRET_KEY: z.string().min(32),
  JWT_ALGORITHM: z.enum(['HS256', 'HS384', 'HS512']).default('HS256'),
  JWT_ACCESS_TOKEN_EXPIRE_MINUTES: z.coerce.number().int().min(1).max(1440).default(30),
  JWT_REFRESH_TOKEN_EXPIRE_DAYS: z.coerce.number().int().min(1).max(365).default(30),

  ARGON2_TIME_COST: z.coerce.number().int().min(1).max(10).default(3),
  ARGON2_MEMORY_COST: z.coerce.number().int().min(1024).max(1048576).default(65536),
  ARGON2_PARALLELISM: z.coerce.number().int().min(1).max(16).default(1),
  ARGON2_HASH_LENGTH: z.coerce.number().int().min(16).max(64).default(32),
  ARGON2_SALT_LENGTH: z.coerce.number().int().min(8).max(32).default(16),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  DEBUG: z.coerce.boolean().default(false),

  BACKEND_CORS_ORIGINS: z.string().min(1),

  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(1).max(1000).default(60),
  LOGIN_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(1).max(100).default(5),
});

export type Config = z.infer<typeof validationSchema>;
