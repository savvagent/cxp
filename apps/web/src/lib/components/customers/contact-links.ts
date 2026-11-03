// The profile card's mailto: and tel: links. A customer's email and phone are
// data typed by anyone: these keep them from adding headers (`?cc=`,
// `&body=`) to the mail link or anything but a number to the phone link.

/** A `mailto:` link to exactly `email`: everything but the `@` is percent-encoded. */
export function mailtoHref(email: string): string {
  return `mailto:${encodeURIComponent(email).replace(/%40/g, "@")}`;
}

/** A `tel:` link to `phone` kept to `+`, digits and `-`. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^+\d-]/g, "")}`;
}
