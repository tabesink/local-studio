export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status = 500, body: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export function delay(ms = 250): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withMockLatency<T>(value: T, ms = 250): Promise<T> {
  await delay(ms);
  return structuredClone(value);
}

export async function failWhen(message: string, shouldFail: boolean): Promise<void> {
  if (shouldFail) {
    await delay(180);
    throw new ApiError(message, 500, { error: message });
  }
}

export type MockStream<T> = AsyncGenerator<T, void, unknown>;

export async function* mockStream<T>(items: T[], ms = 220): MockStream<T> {
  for (const item of items) {
    await delay(ms);
    yield structuredClone(item);
  }
}
