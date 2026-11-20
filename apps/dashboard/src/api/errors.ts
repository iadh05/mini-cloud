import { type ApiErrorBody, apiErrorBody, type ErrorCode } from "@mini-cloud/shared";

type FieldError = NonNullable<ApiErrorBody["error"]["details"]>[number];

/** Status 0 means the request never got an answer (API down, network error). */
export const NO_RESPONSE = 0;

/** An error from the API, built from the standard error body (docs/BACKEND.md §3.5). */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly requestId: string | undefined;
  readonly details: FieldError[];

  constructor(options: {
    status: number;
    code: ErrorCode;
    message: string;
    requestId?: string | undefined;
    details?: FieldError[] | undefined;
  }) {
    super(options.message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.requestId = options.requestId;
    this.details = options.details ?? [];
  }

  static async fromResponse(response: Response): Promise<ApiError> {
    const body: unknown = await response.json().catch(() => undefined);
    const parsed = apiErrorBody.safeParse(body);
    if (parsed.success) {
      const { code, message, requestId, details } = parsed.data.error;
      return new ApiError({ status: response.status, code, message, requestId, details });
    }
    return new ApiError({
      status: response.status,
      code: response.status >= 500 ? "unavailable" : "internal",
      message: `The API answered ${String(response.status)} without an error message.`,
    });
  }

  static noResponse(): ApiError {
    return new ApiError({
      status: NO_RESPONSE,
      code: "unavailable",
      message: "Can't reach the API. Check that it is running.",
    });
  }
}
