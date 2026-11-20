import type { z } from "zod";

/**
 * Turns a shared Zod schema into a Mantine form `validate` function, so the form
 * checks exactly what the API checks. The first message per field wins.
 */
export function zodValidate(schema: z.ZodType) {
  return (values: unknown): Record<string, string> => {
    const result = schema.safeParse(values);
    if (result.success) return {};
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = issue.path.map(String).join(".");
      errors[field] ??= issue.message;
    }
    return errors;
  };
}
