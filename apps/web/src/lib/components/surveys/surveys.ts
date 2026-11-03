// The survey pages' framework-free logic (ported from
// the React console's src/pages/surveys/index.tsx and survey-detail.tsx): the create
// form's schema and payload, the detail page's edit form and update, and how
// questions and answers are shown. Kept out of the components so it is tested
// on its own. (`responsesCount` is shared, in `#lib/surveys.js`.)
import { z } from "#lib/zod.js";
import type { CreateSurveyInput, UpdateSurveyInput } from "#lib/queries/surveys.js";
import type { Survey } from "#lib/types.js";

export const PAGE_SIZE = 20;

/** The questions textareas' placeholder. */
export const QUESTIONS_PLACEHOLDER = '[{"id": "q1", "text": "How satisfied are you?", "type": "rating"}]';

/** The active status badge's (and the edit form's toggle's) extra classes. */
export const ACTIVE_BADGE_CLASS = "bg-green-100 text-green-800 border-green-200 hover:bg-green-100";
export const ACTIVE_TOGGLE_CLASS = "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";

export function statusLabel(active: boolean): string {
  return active ? "Active" : "Inactive";
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

export const INVALID_QUESTIONS = "Questions must be valid JSON";

// ---------------------------------------------------------------------------
// Create form (list page)
// ---------------------------------------------------------------------------

export const createSurveySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  questionsRaw: z.string().optional(),
});

export type CreateSurveyForm = z.infer<typeof createSurveySchema>;

export type CreateSurveyErrors = Partial<Record<keyof CreateSurveyForm, string>>;

export function emptyCreateSurveyForm(): Required<CreateSurveyForm> {
  return { title: "", description: "", questionsRaw: "" };
}

export type CreateSurveyValidation =
  | { success: true; data: CreateSurveyForm }
  | { success: false; errors: CreateSurveyErrors };

/** Validates the form; on failure, the first message for each field. */
export function validateCreateSurvey(values: CreateSurveyForm): CreateSurveyValidation {
  const result = createSurveySchema.safeParse(values);
  if (result.success) return { success: true, data: result.data };
  const errors: CreateSurveyErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof CreateSurveyForm | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return { success: false, errors };
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
  if (!parsed) return { ok: false, message: INVALID_QUESTIONS };
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
  if (!form.title.trim()) return { ok: false, message: "Title is required" };
  const parsed = parseQuestions(form.questionsRaw);
  if (!parsed) return { ok: false, message: INVALID_QUESTIONS };
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
