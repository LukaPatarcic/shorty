import { z } from 'zod';

// URL Created Event
export const URLCreatedEventSchema = z.object({
  type: z.literal('url.created'),
  data: z.object({
    shortUrl: z.string(),
    originalUrl: z.string(),
    createdAt: z.string(),
    expiresAt: z.string().optional(),
    userId: z.string().optional()
  }),
  timestamp: z.string()
});

export type URLCreatedEvent = z.infer<typeof URLCreatedEventSchema>;

// URL Click Event
export const URLClickEventSchema = z.object({
  type: z.literal('url.clicked'),
  data: z.object({
    shortUrl: z.string(),
    timestamp: z.string(),
    userAgent: z.string().optional(),
    ipAddress: z.string().optional(),
    referer: z.string().optional()
  })
});

export type URLClickEvent = z.infer<typeof URLClickEventSchema>; 