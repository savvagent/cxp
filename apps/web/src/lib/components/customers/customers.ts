// The customers pages' framework-free logic, as the React pages had it: the
// create/edit form schema and its mapping to the API, the list's client-side
// search, and the labels the pages show.
import { m } from "#lib/paraglide/messages.js";
import { z } from "#lib/zod.js";
import { validate, type FieldErrors } from "#lib/forms.js";
import type { Customer } from "#lib/types.js";

/** The create and edit customer forms: email required, everything else optional. */
export const customerFormSchema = z.object({
  // A function, so the message is read in the active locale when reported.
  email: z.email({ error: () => m.customer_email_invalid() }),
  name: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  tags: z.string().optional(), // comma-separated, split on submit
});

export type CustomerForm = z.infer<typeof customerFormSchema>;

/** The form's field errors: the first message per field. */
export type CustomerFormErrors = FieldErrors<keyof CustomerForm>;

/** The new-customer form's starting values. */
export const EMPTY_CUSTOMER_FORM: Required<CustomerForm> = {
  email: "",
  name: "",
  phone: "",
  company: "",
  tags: "",
};

/** The edit form's values for `customer`. */
export function customerFormValues(customer: Customer): Required<CustomerForm> {
  return {
    email: customer.email,
    name: customer.name ?? "",
    phone: customer.phone ?? "",
    company: customer.company ?? "",
    tags: customer.tags.join(", "),
  };
}

/**
 * Validates `values`: the payload to send, or the field errors. Empty optional
 * fields are sent as absent and tags are split on commas, trimmed, and empty
 * ones dropped.
 */
export function parseCustomerForm(
  values: CustomerForm,
):
  | {
      ok: true;
      data: { email: string; name?: string; phone?: string; company?: string; tags: string[] };
    }
  | { ok: false; errors: CustomerFormErrors } {
  const result = validate(customerFormSchema, values);
  if (!result.ok) return result;
  const v = result.data;
  return {
    ok: true,
    data: {
      email: v.email,
      name: v.name || undefined,
      phone: v.phone || undefined,
      company: v.company || undefined,
      tags: splitTags(v.tags),
    },
  };
}

/** A comma-separated tag list as tags. */
export function splitTags(tags: string | undefined): string[] {
  return tags
    ? tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];
}

/**
 * The client-side search the list page applies on top of the loaded page:
 * email, name, company or any tag containing the query, case-insensitively.
 */
export function filterCustomers(customers: Customer[], search: string): Customer[] {
  if (!search.trim()) return customers;
  const q = search.toLowerCase();
  return customers.filter(
    (c) =>
      c.email.toLowerCase().includes(q) ||
      c.name?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q)),
  );
}

/** A customer's name, or its email without one. */
export function displayName(customer: Customer): string {
  return customer.name ?? customer.email;
}

/** An enum value as a badge shows one the console has no label for: `page_view` reads `page view`. */
export function humanize(value: string): string {
  return value.replace(/_/g, " ");
}

const INTERACTION_TYPES: Record<string, () => string> = {
  page_view: m.interaction_type_page_view,
  purchase: m.interaction_type_purchase,
  support_contact: m.interaction_type_support_contact,
  email_open: m.interaction_type_email_open,
  email_click: m.interaction_type_email_click,
  feature_use: m.interaction_type_feature_use,
  login: m.interaction_type_login,
};

/** An interaction type in the active locale; one the console does not know, humanized. */
export function interactionTypeLabel(type: string): string {
  return Object.hasOwn(INTERACTION_TYPES, type) ? INTERACTION_TYPES[type]() : humanize(type);
}
