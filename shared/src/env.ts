import { z } from 'zod';

// Base environment schema that all services share
const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  KAFKA_BROKERS: z.string().transform(str => str.split(',')),
});

// Shorten service specific environment
export const shortenServiceEnvSchema = baseEnvSchema.extend({
  DATABASE_URL: z.string().url(),
});

// Redirect service specific environment
export const redirectServiceEnvSchema = baseEnvSchema.extend({
  REDIS_URL: z.string().url(),
});

// Analytics service specific environment
export const analyticsServiceEnvSchema = baseEnvSchema.extend({
  ELASTICSEARCH_URL: z.string().url(),
});

// Environment type definitions
export type BaseEnv = z.infer<typeof baseEnvSchema>;
export type ShortenServiceEnv = z.infer<typeof shortenServiceEnvSchema>;
export type RedirectServiceEnv = z.infer<typeof redirectServiceEnvSchema>;
export type AnalyticsServiceEnv = z.infer<typeof analyticsServiceEnvSchema>;

// Validation functions
export function validateBaseEnv(env: Record<string, unknown>): BaseEnv {
  return baseEnvSchema.parse(env);
}

export function validateShortenServiceEnv(env: Record<string, unknown>): ShortenServiceEnv {
  return shortenServiceEnvSchema.parse(env);
}

export function validateRedirectServiceEnv(env: Record<string, unknown>): RedirectServiceEnv {
  return redirectServiceEnvSchema.parse(env);
}

export function validateAnalyticsServiceEnv(env: Record<string, unknown>): AnalyticsServiceEnv {
  return analyticsServiceEnvSchema.parse(env);
}

// Helper function to ensure all environment variables are present
export function validateEnv<T>(
  schema: z.ZodSchema<T>,
  env: Record<string, unknown> = process.env
): T {
  try {
    return schema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map(err => err.path.join('.'))
        .join(', ');
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
} 