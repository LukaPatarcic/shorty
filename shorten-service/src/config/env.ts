import { validateShortenServiceEnv } from '@shorty/shared';

export const env = validateShortenServiceEnv(process.env);