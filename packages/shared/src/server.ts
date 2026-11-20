import { z } from "zod";
import { resourceResponse } from "./api.ts";
import { resourceName } from "./resource-name.ts";

/**
 * Images a server may run. Users pick an id; the worker runs the pinned image reference.
 * Design: docs/services/servers.md
 */
/** Linux capabilities a server may get back after all are dropped (see infra/modules/server). */
export const SERVER_CAPABILITIES = ["CHOWN", "SETUID", "SETGID", "NET_BIND_SERVICE"] as const;
export type ServerCapability = (typeof SERVER_CAPABILITIES)[number];

interface ServerImageDefinition {
  ref: string;
  label: string;
  defaultPort: number;
  /** Measured: the smallest set the image needs to start and serve (2026-11-20). */
  capabilities: readonly ServerCapability[];
}

export const SERVER_IMAGES = {
  nginx: {
    ref: "nginx:1.29-alpine",
    label: "NGINX web server",
    defaultPort: 80,
    capabilities: ["CHOWN", "SETUID", "SETGID"],
  },
  httpd: {
    ref: "httpd:2.4-alpine",
    label: "Apache HTTP server",
    defaultPort: 80,
    capabilities: [],
  },
  caddy: {
    ref: "caddy:2.10-alpine",
    label: "Caddy web server",
    defaultPort: 80,
    capabilities: ["NET_BIND_SERVICE"],
  },
  whoami: {
    ref: "traefik/whoami:v1.11.0",
    label: "whoami (echoes the request)",
    defaultPort: 80,
    capabilities: [],
  },
} as const satisfies Record<string, ServerImageDefinition>;

export type ServerImage = keyof typeof SERVER_IMAGES;

export const SERVER_IMAGE_IDS = Object.keys(SERVER_IMAGES) as [ServerImage, ...ServerImage[]];

export const PORT_MIN = 1;
export const PORT_MAX = 65_535;

export const serverImage = z.enum(SERVER_IMAGE_IDS, {
  error: () => `Image must be one of: ${SERVER_IMAGE_IDS.join(", ")}`,
});

export const port = z
  .number({ error: "Port must be a number" })
  .int("Port must be a whole number")
  .min(PORT_MIN, `Port must be between ${String(PORT_MIN)} and ${String(PORT_MAX)}`)
  .max(PORT_MAX, `Port must be between ${String(PORT_MIN)} and ${String(PORT_MAX)}`);

/** Desired state of a server, stored in `resources.spec`. */
export const serverSpec = z.strictObject({
  image: serverImage,
  /** Port the app listens on inside the container. */
  port,
});
export type ServerSpec = z.infer<typeof serverSpec>;

/** Body of `POST /v1/servers` and the console's create form. */
export const createServerInput = z.strictObject({
  name: resourceName,
  ...serverSpec.shape,
});
export type CreateServerInput = z.infer<typeof createServerInput>;

/** The pinned image reference the worker runs for an image id. */
export function imageRef(image: ServerImage): string {
  return SERVER_IMAGES[image].ref;
}

/** Results the worker writes once the server runs; empty while it is pending. */
export const serverOutputs = z.object({
  url: z.url().optional(),
  containerId: z.string().optional(),
});
export type ServerOutputs = z.infer<typeof serverOutputs>;

/** A server as the API returns it. */
export const serverResource = resourceResponse(serverSpec, serverOutputs);
export type ServerResource = z.infer<typeof serverResource>;
