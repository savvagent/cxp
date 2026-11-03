// What every console form shares: zod validation to per-field messages, and
// the select values that stand for "no filter" and "none". Framework-free, so
// it is tested on its own.
import type { z } from "#lib/zod.js";

/** The first message for each invalid field. */
export type FieldErrors<K extends string = string> = Partial<Record<K, string>>;

/** A validation's outcome: the parsed values, or the field errors. */
export type Validation<T> = { ok: true; data: T } | { ok: false; errors: FieldErrors<keyof T & string> };

/**
 * Validates `values` with `schema`; on failure, the first message for each
 * field (an issue without a field is left out).
 */
export function validate<T>(schema: z.ZodType<T>, values: unknown): Validation<T> {
  const result = schema.safeParse(values);
  if (result.success) return { ok: true, data: result.data };
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (field === undefined || field === "") continue;
    const key = String(field);
    if (!(key in errors)) errors[key] = issue.message;
  }
  return { ok: false, errors: errors as FieldErrors<keyof T & string> };
}

/**
 * The select item that clears a list filter ("All statuses", "All types", …).
 * A select value only: it never reaches the URL or the API.
 */
export const ALL = "_all";

/**
 * The select item that leaves a form's optional field unset ("None", "No team").
 * A select value only: it never reaches the URL or the API.
 */
export const NONE = "_none";

/** A filter select's value as a filter: the "all" item (or "") is no filter. */
export function fromFilterSelect(value: string | undefined): string | undefined {
  return value && value !== ALL ? value : undefined;
}

/** An optional select's value as a form value: the "none" item means unset (""). */
export function fromOptionalSelect(value: string): string {
  return value === NONE ? "" : value;
}
