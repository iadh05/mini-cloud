import { randomUUID } from "node:crypto";
import type { Database } from "@mini-cloud/db";
import Fastify, { type FastifyServerOptions } from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { serversRoutes } from "./features/servers/servers.routes.ts";
import { registerErrorHandler } from "./plugins/error-handler.ts";
import { createResourcesService } from "./resources/resources.service.ts";
import { healthRoutes } from "./routes/health.ts";

export const REQUEST_ID_HEADER = "x-request-id";
const SAFE_REQUEST_ID = /^[\w.-]{1,128}$/;

export interface AppDeps {
  db: Database;
  logger?: FastifyServerOptions["logger"];
}

/** Builds the API without listening. `index.ts` listens; tests call `app.inject()`. */
export function buildApp({ db, logger = false }: AppDeps) {
  const app = Fastify({
    logger,
    requestIdHeader: false,
    // Reuse a caller's X-Request-Id if it looks safe, otherwise create one.
    genReqId: (request) => {
      const incoming = request.headers[REQUEST_ID_HEADER];
      return typeof incoming === "string" && SAFE_REQUEST_ID.test(incoming)
        ? incoming
        : randomUUID();
    },
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.addHook("onRequest", async (request, reply) => {
    reply.header(REQUEST_ID_HEADER, request.id);
  });

  registerErrorHandler(app);

  const resources = createResourcesService(db);
  app.register(healthRoutes(db));
  app.register(serversRoutes(resources));

  return app;
}

export type App = ReturnType<typeof buildApp>;
