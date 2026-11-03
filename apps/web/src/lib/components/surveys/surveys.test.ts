import { describe, expect, it } from "vitest";
import { validate } from "#lib/forms.js";
import type { Survey } from "#lib/types.js";
import {
  createSurveySchema,
  invalidQuestions,
  answersPreview,
  editFormFromSurvey,
  emptyCreateSurveyForm,
  parseQuestions,
  questionCount,
  questionItems,
  statusLabel,
  surveyUpdate,
  toCreateSurveyInput,
} from "./surveys";

const survey: Survey = {
  id: "s1",
  title: "CSAT",
  description: null,
  questions: [{ id: "q1", text: "How satisfied are you?", type: "rating" }],
  active: false,
  experienceId: null,
  applicationId: null,
  pageId: null,
  componentId: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("survey basics", () => {
  it("counts an array's questions and nothing else", () => {
    expect(questionCount([1, 2, 3])).toBe(3);
    expect(questionCount({ q: 1 })).toBe(0);
    expect(questionCount(null)).toBe(0);
  });

  it("labels the status", () => {
    expect(statusLabel(true)).toBe("Active");
    expect(statusLabel(false)).toBe("Inactive");
  });

  it("parses questions JSON, blank meaning none", () => {
    expect(parseQuestions(undefined)).toEqual({ questions: [] });
    expect(parseQuestions("  \n ")).toEqual({ questions: [] });
    expect(parseQuestions('[{"id":"q1"}]')).toEqual({ questions: [{ id: "q1" }] });
    expect(parseQuestions(" {} ")).toEqual({ questions: {} });
    expect(parseQuestions("[oops")).toBeNull();
  });
});

describe("create survey form", () => {
  it("starts empty", () => {
    expect(emptyCreateSurveyForm()).toEqual({ title: "", description: "", questionsRaw: "" });
  });

  it("requires a title", () => {
    expect(validate(createSurveySchema, emptyCreateSurveyForm())).toEqual({
      ok: false,
      errors: { title: "Title is required" },
    });
    expect(validate(createSurveySchema, { title: "T" }).ok).toBe(true);
  });

  it("builds the payload: title as typed, empty description left out, questions parsed", () => {
    expect(toCreateSurveyInput({ title: " T ", description: "", questionsRaw: "" })).toEqual({
      ok: true,
      input: { title: " T ", description: undefined, questions: [] },
    });
    expect(toCreateSurveyInput({ title: "T", description: "d", questionsRaw: '[{"text":"Q"}]' })).toEqual({
      ok: true,
      input: { title: "T", description: "d", questions: [{ text: "Q" }] },
    });
  });

  it("refuses invalid questions JSON with the React toast", () => {
    expect(toCreateSurveyInput({ title: "T", questionsRaw: "not json" })).toEqual({
      ok: false,
      message: "Questions must be valid JSON",
    });
  });
});

describe("edit survey form", () => {
  it("fills from the survey, questions as indented JSON", () => {
    expect(editFormFromSurvey(survey)).toEqual({
      title: "CSAT",
      description: "",
      active: false,
      questionsRaw: JSON.stringify(survey.questions, null, 2),
    });
  });

  it("trims the title and description, drops a blank description, parses questions", () => {
    expect(
      surveyUpdate("s1", { title: "  New  ", description: "   ", active: true, questionsRaw: "" }),
    ).toEqual({
      ok: true,
      update: { id: "s1", data: { title: "New", description: undefined, questions: [], active: true } },
    });
    expect(
      surveyUpdate("s1", { title: "T", description: " d ", active: false, questionsRaw: '[{"text":"Q"}]' }),
    ).toEqual({
      ok: true,
      update: { id: "s1", data: { title: "T", description: "d", questions: [{ text: "Q" }], active: false } },
    });
  });

  it("requires a title before checking the questions", () => {
    expect(surveyUpdate("s1", { title: "  ", description: "", active: true, questionsRaw: "bad" })).toEqual({
      ok: false,
      message: "Title is required",
    });
    expect(surveyUpdate("s1", { title: "T", description: "", active: true, questionsRaw: "bad" })).toEqual({
      ok: false,
      message: invalidQuestions(),
    });
  });
});

describe("display", () => {
  it("shows each question's text, question, label or JSON, with its type", () => {
    expect(
      questionItems([
        { text: "A", type: "rating" },
        { question: "B" },
        { label: "C", type: "" },
        { id: "q4" },
        "plain",
        null,
      ]),
    ).toEqual([
      { text: "A", type: "rating" },
      { text: "B", type: undefined },
      { text: "C", type: undefined },
      { text: '{"id":"q4"}', type: undefined },
      { text: '"plain"', type: undefined },
      { text: "null", type: undefined },
    ]);
    expect(questionItems(undefined)).toEqual([]);
    expect(questionItems({ text: "x" })).toEqual([]);
  });

  it("cuts answers longer than 80 characters", () => {
    expect(answersPreview({ a: 1 })).toEqual({ full: '{"a":1}', short: '{"a":1}' });
    const long = { a: "x".repeat(100) };
    const { full, short } = answersPreview(long);
    expect(full).toBe(JSON.stringify(long));
    expect(short).toBe(`${full.slice(0, 80)}…`);
  });
});
