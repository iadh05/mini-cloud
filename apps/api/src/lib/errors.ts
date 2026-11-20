import type { ErrorCode } from "@mini-cloud/shared";

/** An expected error: the error handler turns it into an HTTP response. */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;

  constructor(statusCode: number, code: ErrorCode, message: string) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  constructor(what: string, id: string) {
    super(404, "not_found", `${what} ${id} was not found`);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, "name_taken", message);
  }
}

const UNIQUE_VIOLATION = "23505";

/** True when Postgres rejected a row because of the given unique constraint. */
export function isUniqueViolation(error: unknown, constraint: string): boolean {
  for (let e: unknown = error; e instanceof Error; e = e.cause) {
    const pg = e as Error & { code?: string; constraint?: string };
    if (pg.code === UNIQUE_VIOLATION && pg.constraint === constraint) return true;
  }
  return false;
}
