import { z } from "zod";

export const healthResponseSchema = z.object({
  ok: z.boolean(),
  service: z.string().optional(),
  version: z.string().optional(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
