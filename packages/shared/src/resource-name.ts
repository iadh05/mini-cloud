import { z } from "zod";

export const RESOURCE_NAME_MIN = 3;
export const RESOURCE_NAME_MAX = 40;

/**
 * A resource name is also a DNS label (`<name>.<BASE_DOMAIN>`), so it follows DNS rules:
 * lowercase letters, digits and hyphens, starts with a letter, does not end with a hyphen.
 */
export const RESOURCE_NAME_PATTERN = /^[a-z](?:[a-z0-9-]*[a-z0-9])?$/;

export const resourceName = z
  .string()
  .min(RESOURCE_NAME_MIN, `Name must be at least ${String(RESOURCE_NAME_MIN)} characters`)
  .max(RESOURCE_NAME_MAX, `Name must be at most ${String(RESOURCE_NAME_MAX)} characters`)
  .regex(
    RESOURCE_NAME_PATTERN,
    "Use lowercase letters, digits and hyphens; start with a letter and do not end with a hyphen",
  );

export type ResourceName = z.infer<typeof resourceName>;
