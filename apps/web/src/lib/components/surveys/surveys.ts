// The survey pages' framework-free logic: the create form's schema and
// payload, the detail page's edit form and update, and how questions and
// answers are shown. Kept out of the components so it is tested on its own.
// (`responsesCount` is shared, in `#lib/surveys.js`.)
import { m } from "#lib/paraglide/messages.js";
import { z } from "#lib/zod.js";
import type { CreateSurveyInput, UpdateSurveyInput } from "#lib/queries/surveys.js";
import type { Survey } from "#lib/types.js";

/**
 * The questions textareas' placeholder: an example question in the active
 * locale, as JSON (`[{"id": "q1", "text": "…", "type": "rating"}]`). Built
 * here rather than in the catalog, where its braces would read as placeholders.
 */
export function questionsPlaceholder(): string {
  const text = JSON.stringify(m.survey_question_example());
  return `[{"id": "q1", "text": ${text}, "type": "rating"}]`;
}

/** The active status badge's (and the edit form's toggle's) extra classes. */
export const ACTIVE_BADGE_CLASS = "bg-green-100 text-green-800 border-green-200 hover:bg-green-100";
export const ACTIVE_TOGGLE_CLASS = "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";

export function statusLabel(active: boolean): string {
  return active ? m.survey_active() : m.survey_inactive();
}

/** How many questions a survey has: the length of its questions array, else 0. */
export function questionCount(questions: unknown): number {
  return Array.isArray(questions) ? questions.length : 0;
}

/**
 * The questions JSON a form holds, parsed: blank means no questions (`[]`);
 * anything else must be valid JSON. `null` when it is not.
 */
export function parseQuestions(raw: string | undefined): { questions: unknown } | null {
  if (!raw?.trim()) return { questions: [] };
  try {
    return { questions: JSON.parse(raw) };
  } catch {
    return null;
  }
}

/** The toast for a questions field that is not valid JSON. */
export const invalidQuestions = (): string => m.survey_questions_invalid();

// ---------------------------------------------------------------------------
// Create form (list page)
// ---------------------------------------------------------------------------

export const createSurveySchema = z.object({
  // A function, so the message is read in the active locale when reported.
  title: z.string().min(1, { error: () => m.survey_title_required() }),
  description: z.string().optional(),
  questionsRaw: z.string().optional(),
});

export type CreateSurveyForm = z.infer<typeof createSurveySchema>;

export function emptyCreateSurveyForm(): Required<CreateSurveyForm> {
  return { title: "", description: "", questionsRaw: "" };
}

/**
 * The API payload for a valid form, or the toast to show instead when the
 * questions are not valid JSON. The title is sent as typed and an empty
 * description is left out, as React did.
 */
export function toCreateSurveyInput(
  values: CreateSurveyForm,
): { ok: true; input: CreateSurveyInput } | { ok: false; message: string } {
  const parsed = parseQuestions(values.questionsRaw);
  if (!parsed) return { ok: false, message: invalidQuestions() };
  return {
    ok: true,
    input: {
      title: values.title,
      description: values.description || undefined,
      questions: parsed.questions,
    },
  };
}

// ---------------------------------------------------------------------------
// Edit form (detail page)
// ---------------------------------------------------------------------------

export interface SurveyEditForm {
  title: string;
  description: string;
  active: boolean;
  questionsRaw: string;
}

/** The edit form's values for `survey`; the questions as indented JSON. */
export function editFormFromSurvey(survey: Survey): SurveyEditForm {
  return {
    title: survey.title,
    description: survey.description ?? "",
    active: survey.active,
    questionsRaw: JSON.stringify(survey.questions, null, 2) ?? "",
  };
}

/**
 * The update for an edit form, or the toast to show instead: the title is
 * required (after trimming), the questions must be valid JSON (blank is `[]`),
 * and a blank description is left out.
 */
export function surveyUpdate(
  id: string,
  form: SurveyEditForm,
): { ok: true; update: UpdateSurveyInput } | { ok: false; message: string } {
  if (!form.title.trim()) return { ok: false, message: m.survey_title_required() };
  const parsed = parseQuestions(form.questionsRaw);
  if (!parsed) return { ok: false, message: invalidQuestions() };
  return {
    ok: true,
    update: {
      id,
      data: {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        questions: parsed.questions,
        active: form.active,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

export interface QuestionItem {
  text: string;
  type: string | undefined;
}

/**
 * The questions list's rows: each question's `text`, else `question`, else
 * `label`, else the question as JSON, and its `type` badge when it has one.
 * Anything but an array is no questions.
 */
export function questionItems(questions: unknown): QuestionItem[] {
  if (!Array.isArray(questions)) return [];
  return questions.map((q: unknown) => {
    const obj = (q !== null && typeof q === "object" ? q : {}) as Record<string, unknown>;
    const text = obj.text ?? obj.question ?? obj.label ?? JSON.stringify(q);
    return { text: String(text), type: obj.type ? String(obj.type) : undefined };
  });
}

/** A response's answers as JSON, and that cut to 80 characters with an ellipsis. */
export function answersPreview(answers: unknown): { full: string; short: string } {
  const full = JSON.stringify(answers) ?? "";
  return { full, short: full.length > 80 ? `${full.slice(0, 80)}…` : full };
}
