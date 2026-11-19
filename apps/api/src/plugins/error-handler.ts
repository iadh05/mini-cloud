import type { ApiErrorBody } from "@mini-cloud/shared";
import type { FastifyError, FastifyInstance } from "fastify";
import { AppError } from "../lib/errors.ts";

interface ValidationItem {
  instancePath?: string;
  message?: string;
  params?: { issue?: { path?: PropertyKey[] } };
}

function field(item: ValidationItem, context: string | undefined): string {
  const path = item.params?.issue?.path?.map(String).join(".");
  if (path) return path;
  const fromPointer = item.instancePath?.replace(/^\//, "").replaceAll("/", ".");
  if (fromPointer) return fromPointer;
  return context ?? "body";
}

/** One place that turns any error into the standard error body (docs/BACKEND.md §3.5). */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    const requestId = request.id;

    if (error.validation) {
      const body: ApiErrorBody = {
        error: {
          code: "validation_failed",
          message: "The request is not valid",
          requestId,
          details: error.validation.map((item) => ({
            field: field(item as ValidationItem, error.validationContext),
            message: item.message ?? "invalid",
          })),
        },
      };
      return reply.code(400).send(body);
    }

    if (error instanceof AppError) {
      const body: ApiErrorBody = { error: { code: error.code, message: error.message, requestId } };
      return reply.code(error.statusCode).send(body);
    }

    request.log.error({ err: error }, "unhandled error");
    const body: ApiErrorBody = {
      error: { code: "internal", message: "Something went wrong on our side", requestId },
    };
    return reply.code(500).send(body);
  });

  app.setNotFoundHandler((request, reply) => {
    const body: ApiErrorBody = {
      error: {
        code: "not_found",
        message: `Route ${request.method} ${request.url} does not exist`,
        requestId: request.id,
      },
    };
    return reply.code(404).send(body);
  });
}
