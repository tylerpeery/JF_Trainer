import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { calculateProfile } from "../js/assessment.js";
import { validateAssessmentAnswers } from "../js/assessment-validation.js";
import { createLocalStorageAdapter } from "../js/storage/local-storage.js";

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
}

const appConfig = await readJson("../data/app-config.json");
const assessmentConfig = await readJson("../data/assessment-questions.json");

function baseAnswers(overrides = {}) {
  return {
    primaryField: "Intelligence, research, and analysis",
    secondaryFields: [],
    workPatterns: ["analyze-information"],
    learningGoals: ["evaluate-outputs"],
    genAiFrequency: "once-or-twice",
    independentExperience: ["simple-question"],
    verifyOutput: "verify-important-claims",
    promptWorkflow: "rewrite-more-detail",
    responsibleHandling: "approved-minimize",
    limitations: "patterns-bias-context",
    technicalExperience: "ordinary-software",
    aiResponsibility: "own-tasks",
    weeklyTime: "30-60",
    preferredFormats: ["reading"],
    ...overrides
  };
}

function profile(overrides = {}) {
  return calculateProfile(baseAnswers(overrides), assessmentConfig, appConfig);
}

function evidenceText(result, dimension) {
  return result[dimension].evidence.join(" ");
}

function createMemoryStorage(initialValue = null) {
  let value = initialValue;

  return {
    getItem() {
      return value;
    },
    setItem(_key, nextValue) {
      value = nextValue;
    },
    removeItem() {
      value = null;
    }
  };
}

test("no-use user with strong hypothetical judgment is capped at foundational", () => {
  const result = profile({
    genAiFrequency: "never",
    independentExperience: ["none-yet"],
    verifyOutput: "verify-document-judgment",
    promptWorkflow: "break-test-steps",
    responsibleHandling: "full-handling-review",
    limitations: "task-consequence-review"
  });

  assert.equal(result.practicalFluency.level.id, "foundational-user");
  assert.match(evidenceText(result, "practicalFluency"), /No independent AI activities/);
});

test("frequent user with weak verification and responsible-use practices is not advanced", () => {
  const result = profile({
    genAiFrequency: "daily",
    independentExperience: ["simple-question"],
    verifyOutput: "read-obvious-errors",
    promptWorkflow: "ask-same-again",
    responsibleHandling: "enter-needed"
  });

  assert.notEqual(result.practicalFluency.level.id, "advanced-practitioner");
  assert.match(evidenceText(result, "practicalFluency"), /verification/i);
});

test("strong nontechnical analyst can reach applied practical fluency without technical inflation", () => {
  const result = profile({
    secondaryFields: ["Education, training, and communication"],
    workPatterns: ["analyze-information", "create-communicate"],
    independentExperience: ["provided-context", "verified-authoritative"],
    verifyOutput: "verify-document-judgment",
    promptWorkflow: "add-context-format",
    responsibleHandling: "full-handling-review",
    limitations: "task-consequence-review",
    technicalExperience: "ordinary-software"
  });

  assert.equal(result.practicalFluency.level.id, "applied-user");
  assert.equal(result.technicalOrientation.level.id, "general-user");
  assert.match(evidenceText(result, "practicalFluency"), /authoritative sources|sources/);
});

test("governance leader with ordinary technical experience remains general user technically", () => {
  const result = profile({
    primaryField: "Leadership, policy, and governance",
    workPatterns: ["lead-govern"],
    aiResponsibility: "policy-risk",
    technicalExperience: "ordinary-software",
    responsibleHandling: "full-handling-review",
    verifyOutput: "verify-document-judgment"
  });

  assert.equal(result.technicalOrientation.level.id, "general-user");
  assert.match(evidenceText(result, "technicalOrientation"), /do not raise technical orientation/);
});

test("low-code productivity user maps to productivity and low-code orientation", () => {
  const result = profile({
    technicalExperience: "advanced-spreadsheets-low-code"
  });

  assert.equal(result.technicalOrientation.level.id, "productivity-low-code");
  assert.match(evidenceText(result, "technicalOrientation"), /low-code|spreadsheets/);
});

test("developer with weak responsible-use knowledge is not advanced practical fluency", () => {
  const result = profile({
    independentExperience: ["code-data-api-automation"],
    technicalExperience: "software-apis",
    verifyOutput: "read-obvious-errors",
    responsibleHandling: "enter-needed",
    promptWorkflow: "rewrite-more-detail"
  });

  assert.equal(result.technicalOrientation.level.id, "developer-data-practitioner");
  assert.notEqual(result.practicalFluency.level.id, "advanced-practitioner");
  assert.match(evidenceText(result, "practicalFluency"), /Responsible information-handling/);
});

test("responsible software or data practitioner can be technical without becoming AI/ML builder", () => {
  const result = profile({
    independentExperience: ["code-data-api-automation", "repeatable-workflow", "verified-authoritative"],
    technicalExperience: "scripts-query-data",
    verifyOutput: "verify-document-judgment",
    promptWorkflow: "break-test-steps",
    responsibleHandling: "full-handling-review",
    limitations: "task-consequence-review"
  });

  assert.equal(result.practicalFluency.level.id, "advanced-practitioner");
  assert.equal(result.technicalOrientation.level.id, "developer-data-practitioner");
  assert.match(evidenceText(result, "technicalOrientation"), /code, scripts, data tools, APIs, or automation/);
});

test("AI/ML builder requires explicit AI or machine-learning system evidence", () => {
  const result = profile({
    independentExperience: ["ai-ml-system"],
    technicalExperience: "ai-ml-builder"
  });

  assert.equal(result.technicalOrientation.level.id, "ai-ml-builder");
  assert.match(evidenceText(result, "technicalOrientation"), /AI or machine-learning systems/);
});

test("strong governance knowledge without technical-building evidence does not unlock developer categories", () => {
  const result = profile({
    aiResponsibility: "policy-risk",
    responsibleHandling: "full-handling-review",
    limitations: "task-consequence-review",
    technicalExperience: "ordinary-software"
  });

  assert.equal(result.technicalOrientation.level.id, "general-user");
  assert.match(evidenceText(result, "technicalOrientation"), /do not raise technical orientation/);
});

test("coding experience alone does not create advanced practical fluency", () => {
  const result = profile({
    independentExperience: ["code-data-api-automation"],
    technicalExperience: "software-apis",
    verifyOutput: "read-obvious-errors",
    responsibleHandling: "avoid-obvious-sensitive",
    limitations: "sometimes-wrong"
  });

  assert.notEqual(result.practicalFluency.level.id, "advanced-practitioner");
  assert.match(evidenceText(result, "technicalOrientation"), /code, scripts, data tools, APIs, or automation/);
});

test("no activity plus strong scenario answers remains capped at foundational", () => {
  const result = profile({
    independentExperience: ["none-yet"],
    verifyOutput: "verify-document-judgment",
    promptWorkflow: "break-test-steps",
    responsibleHandling: "full-handling-review",
    limitations: "task-consequence-review"
  });

  assert.equal(result.practicalFluency.level.id, "foundational-user");
  assert.match(evidenceText(result, "practicalFluency"), /cannot exceed Foundational user/);
});

test("repeatable workflow plus verification and responsible-use evidence qualifies for advanced status", () => {
  const result = profile({
    genAiFrequency: "daily",
    independentExperience: ["repeatable-workflow", "verified-authoritative"],
    verifyOutput: "verify-document-judgment",
    promptWorkflow: "break-test-steps",
    responsibleHandling: "full-handling-review",
    limitations: "task-consequence-review"
  });

  assert.equal(result.practicalFluency.level.id, "advanced-practitioner");
  assert.match(evidenceText(result, "practicalFluency"), /repeatable workflow/);
});

test("validator rejects primary field duplicated as secondary", () => {
  const errors = validateAssessmentAnswers(
    baseAnswers({ secondaryFields: ["Intelligence, research, and analysis"] }),
    appConfig,
    assessmentConfig
  );

  assert.match(errors.join(" "), /Primary professional field cannot also be selected/);
});

test("validator rejects too many secondary fields", () => {
  const errors = validateAssessmentAnswers(
    baseAnswers({
      secondaryFields: [
        "Operations and mission planning",
        "Maintenance and logistics",
        "Healthcare"
      ]
    }),
    appConfig,
    assessmentConfig
  );

  assert.match(errors.join(" "), /no more than 2 secondary/);
});

test("validator rejects too many work patterns", () => {
  const errors = validateAssessmentAnswers(
    baseAnswers({
      workPatterns: [
        "analyze-information",
        "create-communicate",
        "plan-decide",
        "build-automate"
      ]
    }),
    appConfig,
    assessmentConfig
  );

  assert.match(errors.join(" "), /no more than 3 work patterns/);
});

test("validator rejects too many learning goals", () => {
  const errors = validateAssessmentAnswers(
    baseAnswers({
      learningGoals: [
        "evaluate-outputs",
        "work-with-data",
        "responsible-use-risk",
        "teach-others"
      ]
    }),
    appConfig,
    assessmentConfig
  );

  assert.match(errors.join(" "), /no more than 3 learning goals/);
});

test("validator rejects None yet combined with completed activities", () => {
  const errors = validateAssessmentAnswers(
    baseAnswers({ independentExperience: ["none-yet", "simple-question"] }),
    appConfig,
    assessmentConfig
  );

  assert.match(errors.join(" "), /cannot be combined/);
});

test("validator rejects unknown and incomplete answers", () => {
  const errors = validateAssessmentAnswers(
    baseAnswers({
      primaryField: "",
      workPatterns: ["unknown-work"],
      technicalExperience: "unknown-tech",
      preferredFormats: []
    }),
    appConfig,
    assessmentConfig
  );

  const joined = errors.join(" ");
  assert.match(joined, /primary professional field/);
  assert.match(joined, /unknown-work/);
  assert.match(joined, /unknown-tech/);
  assert.match(joined, /preferred format/);
});

test("outdated assessment version is discarded without clearing unrelated guest data", () => {
  const storedState = {
    version: 1,
    mode: "guest",
    activeView: "progress",
    guestStartedAt: "2026-01-01T00:00:00.000Z",
    assessment: {
      assessmentVersion: "phase-2-v1",
      completedAt: "2026-01-02T00:00:00.000Z"
    },
    progress: {
      resourceStates: { sample: { status: "started" } }
    },
    achievements: [],
    updatedAt: "2026-01-02T00:00:00.000Z"
  };
  const adapter = createLocalStorageAdapter(createMemoryStorage(JSON.stringify(storedState)));
  const loaded = adapter.load();

  assert.equal(loaded.state.assessment, null);
  assert.equal(loaded.state.progress.resourceStates.sample.status, "started");
  assert.match(loaded.recoverableError, /retake the assessment/);
});

test("corrupted stored assessment data is discarded without crashing", () => {
  const storedState = {
    version: 1,
    mode: "guest",
    activeView: "assessment",
    guestStartedAt: "2026-01-01T00:00:00.000Z",
    assessment: {
      assessmentVersion: "phase-2-joint-force-v2",
      practicalFluency: { level: { id: "applied-user" } },
      technicalOrientation: { level: { id: "general-user" } },
      answers: {}
    },
    progress: {
      resourceStates: { sample: { status: "started" } }
    },
    achievements: [],
    updatedAt: "2026-01-02T00:00:00.000Z"
  };
  const adapter = createLocalStorageAdapter(createMemoryStorage(JSON.stringify(storedState)));
  const loaded = adapter.load();

  assert.equal(loaded.state.assessment, null);
  assert.equal(loaded.state.progress.resourceStates.sample.status, "started");
  assert.match(loaded.recoverableError, /retake the assessment/);
});
