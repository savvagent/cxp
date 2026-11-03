// The console's text follows the active locale, including the text built when
// a module loads (navigation, option lists, zod schemas): those modules are
// evaluated before the root layout resolves the locale, so each label has to
// be read when it is shown, never captured as a string.
import { afterEach, describe, expect, it } from "vitest";
import { CATALOG_ITEMS, NAV_ITEMS, PALETTE_ITEMS, routeTitle } from "#lib/components/layout/nav.js";
import { parseCustomerForm } from "#lib/components/customers/customers.js";
import { interactionTypeLabel } from "#lib/components/customers/customers.js";
import { FEEDBACK_TYPES, feedbackTypeLabel } from "#lib/components/feedback/feedback.js";
import { statusLabel } from "#lib/components/shared/badges.js";
import { questionsPlaceholder, statusLabel as surveyStatusLabel } from "#lib/components/surveys/surveys.js";
import { STATUS_OPTIONS, channelLabel, createTicketSchema, ticketCount } from "#lib/components/tickets/tickets.js";
import { validate } from "#lib/forms.js";
import { getLocale, overwriteGetLocale } from "#lib/paraglide/runtime.js";
import { loginErrorMessage } from "#lib/session.js";
import { responsesCount } from "#lib/surveys.js";

const defaultGetLocale = getLocale;
afterEach(() => overwriteGetLocale(defaultGetLocale));

describe("text built at module load", () => {
  it("follows a locale chosen after the modules loaded", () => {
    expect(NAV_ITEMS[0].label).toBe("Dashboard");
    overwriteGetLocale(() => "de");
    expect(NAV_ITEMS.map((i) => i.label)).not.toContain("Customers");
    expect(PALETTE_ITEMS.at(-1)?.label).toBe("Katalog");
    expect(routeTitle("/console/customers/1")).toBe(NAV_ITEMS[1].label);
    expect(CATALOG_ITEMS.every((i) => i.label.length > 0)).toBe(true);
    expect(STATUS_OPTIONS[0].label).not.toBe("Open");
    expect(FEEDBACK_TYPES[0].label).not.toBe("Bug Report");
  });

  it("validates in the active locale", () => {
    overwriteGetLocale(() => "es");
    const customer = parseCustomerForm({ email: "nope" });
    expect(customer.ok).toBe(false);
    expect(!customer.ok && customer.errors.email).not.toBe("Enter a valid email address");
    const ticket = validate(createTicketSchema, { customer_id: "", subject: "" });
    expect(!ticket.ok && ticket.errors.subject).not.toBe("Subject is required");
  });

  it("explains a sign-in failure in the active locale", () => {
    const english = loginErrorMessage("?login_error=access_denied");
    overwriteGetLocale(() => "fr");
    expect(loginErrorMessage("?login_error=access_denied")).not.toBe(english);
  });
});

describe("labels for values the server sends", () => {
  it("names statuses, channels, feedback and interaction types, and keeps unknown ones readable", () => {
    overwriteGetLocale(() => "it");
    expect(statusLabel("in_progress")).not.toBe("In Progress");
    expect(channelLabel("social")).not.toBe("social");
    expect(feedbackTypeLabel("praise")).not.toBe("Praise");
    expect(interactionTypeLabel("page_view")).not.toBe("Page view");
    expect(interactionTypeLabel("new_kind")).toBe("new kind");
    expect(surveyStatusLabel(true)).not.toBe("Active");
  });
});

describe("counts", () => {
  it("pluralize and group digits for the locale", () => {
    expect(ticketCount(1)).toBe("1 ticket");
    expect(ticketCount(1234)).toBe("1,234 tickets");
    overwriteGetLocale(() => "de");
    expect(ticketCount(1234)).toContain("1.234");
    expect(responsesCount(50, 1200)).toContain("1.200");
  });

  it("keep the example questions JSON valid in every locale", () => {
    for (const locale of ["en", "es", "de", "fr", "it", "hi"] as const) {
      overwriteGetLocale(() => locale);
      const parsed = JSON.parse(questionsPlaceholder());
      expect(parsed[0]).toMatchObject({ id: "q1", type: "rating" });
    }
  });
});
