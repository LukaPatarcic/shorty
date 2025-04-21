import { validateRedirectServiceEnv } from "@shorty/shared";

export const env = validateRedirectServiceEnv(process.env);