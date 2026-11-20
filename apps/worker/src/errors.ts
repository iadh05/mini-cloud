/**
 * A failure the user can understand and fix (bad spec, image not found…).
 * Its message is stored in `resources.error` and shown in the console.
 * Any other error is a bug: the user sees a generic message, the details go to the logs.
 */
export class UserError extends Error {
  override name = "UserError";
}

/** Shown to the user when the worker hits a bug; the real error is in the worker logs. */
export const INTERNAL_ERROR_MESSAGE = "Internal error while provisioning. See the worker logs.";

const MAX_MESSAGE = 1000;

/** Keeps stored error messages short enough to show in a table cell. */
export function shorten(message: string): string {
  return message.length > MAX_MESSAGE ? `${message.slice(0, MAX_MESSAGE - 1)}…` : message;
}
