import type { Resource } from "@mini-cloud/db";
import {
  apiErrorBody,
  createServerInput,
  idParams,
  page,
  pageQuery,
  serverOutputs,
  serverResource,
  serverSpec,
} from "@mini-cloud/shared";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { toResponse } from "../../resources/resources.mapper.ts";
import type { ResourcesService } from "../../resources/resources.service.ts";

const toServer = (row: Resource) => toResponse(row, { spec: serverSpec, outputs: serverOutputs });

/** Thin routes: validate, call the service with type "server", reply. */
export function serversRoutes(resources: ResourcesService): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.post(
      "/v1/servers",
      {
        schema: {
          body: createServerInput,
          response: { 202: serverResource, 400: apiErrorBody, 409: apiErrorBody },
        },
      },
      async (request, reply) => {
        const { name, ...spec } = request.body;
        const resource = await resources.create({ type: "server", name, spec });
        return reply.code(202).send(toServer(resource));
      },
    );

    app.get(
      "/v1/servers",
      { schema: { querystring: pageQuery, response: { 200: page(serverResource) } } },
      async (request) => {
        const result = await resources.list("server", request.query);
        return { items: result.items.map(toServer), nextCursor: result.nextCursor };
      },
    );

    app.get(
      "/v1/servers/:id",
      { schema: { params: idParams, response: { 200: serverResource, 404: apiErrorBody } } },
      async (request) => toServer(await resources.get("server", request.params.id)),
    );

    done();
  };
}
