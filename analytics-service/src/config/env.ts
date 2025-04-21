import { validateAnalyticsServiceEnv } from "@shorty/shared";

export const env = validateAnalyticsServiceEnv(process.env);