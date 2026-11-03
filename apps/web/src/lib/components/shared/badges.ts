// The colours of the ticket status and priority badges, as the old console
// had them. A value the console does not know gets the plain outline badge.

const STATUS_CLASSES: Record<string, string> = {
  open: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  in_progress: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  waiting: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  resolved: "bg-green-100 text-green-800 hover:bg-green-100",
  closed: "bg-gray-100 text-gray-800 hover:bg-gray-100",
};

const PRIORITY_CLASSES: Record<string, string> = {
  urgent: "bg-red-100 text-red-800 hover:bg-red-100",
  high: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  medium: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  low: "bg-green-100 text-green-800 hover:bg-green-100",
};

function own(map: Record<string, string>, key: string): string {
  return Object.hasOwn(map, key) ? map[key] : "";
}

/** The colour classes of a ticket status badge (`""` for an unknown status). */
export function statusClass(status: string): string {
  return own(STATUS_CLASSES, status);
}

/** A ticket status as a badge shows it: `in_progress` reads `in progress`. */
export function statusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

/** The colour classes of a ticket priority badge (`""` for an unknown priority). */
export function priorityClass(priority: string): string {
  return own(PRIORITY_CLASSES, priority);
}
