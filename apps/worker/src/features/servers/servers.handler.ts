import { SERVER_IMAGES, serverOutputs, serverSpec } from "@mini-cloud/shared";
import { UserError } from "../../errors.ts";
import type { ResourceHandler } from "../handler.ts";

/** Servers: one hardened container per resource, through `infra/modules/server`. */
export const serverHandler: ResourceHandler = {
  module: "server",

  variables(resource, ctx) {
    // The API validated the spec already; check again, the database is not a trust boundary.
    const parsed = serverSpec.safeParse(resource.spec);
    if (!parsed.success) {
      const reasons = parsed.error.issues.map((issue) => issue.message).join("; ");
      throw new UserError(`The server spec is invalid: ${reasons}`);
    }
    const image = SERVER_IMAGES[parsed.data.image];
    return {
      resource_id: resource.id,
      name: resource.name,
      image: image.ref,
      port: parsed.data.port,
      base_domain: ctx.baseDomain,
      cap_add: [...image.capabilities],
    };
  },

  outputs: ["container_id", "url"],

  toOutputs(raw) {
    return serverOutputs.parse({ containerId: raw.container_id, url: raw.url });
  },
};
