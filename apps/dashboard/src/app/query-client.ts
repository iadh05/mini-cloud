import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "../api/errors.ts";

const MAX_RETRIES = 2;

/** Retry network and server errors; a 4xx will not change by asking again. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  const clientError = error instanceof ApiError && error.status >= 400 && error.status < 500;
  return !clientError && failureCount < MAX_RETRIES;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 5_000, retry: shouldRetry },
      mutations: { retry: false },
    },
  });
}
