// Survey helpers the survey pages share. Framework-free, so they are tested on their own.
import { formatNumber } from "./format.js";
import { m } from "./paraglide/messages.js";

/**
 * The responses heading's count. The console fetches the first page only, so
 * when fewer responses are shown than exist it says how many of the total.
 */
export function responsesCount(shown: number, total: number): string {
  return shown < total
    ? m.survey_responses_of({ shown: formatNumber(shown), total: formatNumber(total) })
    : formatNumber(total);
}
