import { z } from "zod";

import { getApiClient, type ApiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";

export const roleSchema = z.enum(["member", "admin"]);
export type Role = z.infer<typeof roleSchema>;

const currentUserWireSchema = z
  .object({
    id: z.string().min(1),
    email: z.string().email(),
    displayName: z.string().nullable().optional(),
    display_name: z.string().nullable().optional(),
    role: roleSchema,
    isActive: z.boolean().optional(),
    is_active: z.boolean().optional(),
  })
  .transform((value) => ({
    id: value.id,
    email: value.email,
    displayName: value.displayName ?? value.display_name ?? null,
    role: value.role,
    isActive: value.isActive ?? value.is_active ?? true,
  }));

export type CurrentUser = z.infer<typeof currentUserWireSchema>;

export function parseCurrentUser(input: unknown): CurrentUser {
  return currentUserWireSchema.parse(input);
}

export async function fetchCurrentUser(client: ApiClient = getApiClient()) {
  const payload = await client.request<unknown>("/auth/me", {
    method: "GET",
  });

  return parseCurrentUser(payload);
}

export function isUnauthenticatedError(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

export function formatSessionError(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof z.ZodError) {
    return "Session response did not match the expected user contract.";
  }

  return "Unable to resolve the current session.";
}
