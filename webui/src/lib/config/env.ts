import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z
    .string({
      error: "Public API URL is required.",
    })
    .url("Public API URL must be a valid absolute URL."),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function parsePublicEnv(
  input: Record<string, string | undefined>,
): PublicEnv {
  const result = publicEnvSchema.safeParse(input);

  if (!result.success) {
    const message =
      result.error.issues[0]?.message ?? "Public environment is invalid.";
    throw new Error(message);
  }

  return result.data;
}

export function getPublicEnv(): PublicEnv {
  return parsePublicEnv({
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  });
}
