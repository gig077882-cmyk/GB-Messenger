import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_PATH: z.string().default('./data/krug.sqlite'),
  STORAGE_PATH: z.string().default('./data/storage'),
  JWT_SECRET: z.string().min(32).default('development-secret-change-me-123456789'),
  ACCESS_TTL: z.string().default('15m'),
  REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),
  COOKIE_SECURE: z
    .union([z.boolean(), z.string().transform((v) => v === 'true')])
    .default(true),
  MAX_USERS: z.coerce.number().int().positive().default(60),
  MAX_FILE_BYTES: z.coerce.number().int().positive().default(5_368_709_120),
  UPLOAD_CHUNK_BYTES: z.coerce.number().int().positive().default(8_388_608),
  FILE_RETENTION_HOURS: z.coerce.number().int().positive().default(72),
  MIN_FREE_BYTES: z.coerce.number().int().nonnegative().default(53_687_091_200),
  MAX_STORAGE_BYTES: z.coerce.number().int().positive().default(322_122_547_200),
  EDIT_WINDOW_SECONDS: z.coerce.number().int().min(60).max(86400).default(900),
  CALL_RECONNECT_GRACE_SECONDS: z.coerce.number().int().min(10).max(300).default(45),
  TURN_SHARED_SECRET: z.string().optional(),
  TURN_HOST: z.string().optional(),
});

export type Config = z.infer<typeof schema>;

export const loadConfig = (overrides: Record<string, unknown> = {}): Config =>
  schema.parse({ ...process.env, ...overrides });
