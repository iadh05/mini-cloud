import type { ServiceId } from "@mini-cloud/shared";
import type { ResourceHandler } from "./handler.ts";
import { serverHandler } from "./servers/servers.handler.ts";

const HANDLERS: Partial<Record<ServiceId, ResourceHandler>> = {
  server: serverHandler,
};

/** The handler for a resource type, or undefined if the worker cannot provision it yet. */
export function findHandler(type: string): ResourceHandler | undefined {
  return Object.hasOwn(HANDLERS, type) ? HANDLERS[type as ServiceId] : undefined;
}
