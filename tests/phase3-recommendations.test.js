import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { buildLearningPath } from "../js/recommendations.js";

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
}

const appConfig = await readJson("../data/app-config.json");
const catalog = await readJson("../data/training-resources.json");
const practiceCards = await readJson("../data/applied-practice-cards.json");
const recommendationConfig = await readJson("../data/recommendation-config.json");
const allowedDurationStatuses = new Set([
  "verified",
  "verified-official",
  "verified-official-approximate",
  "verified-official-sum",
  "verified-official-variable",
  "needs-manual-verification"
]);
const expectedDurationMinutes = new Map([
  ["elements-introduction-to-ai", 1800],
  ["microsoft-learn-what-generative-ai", 30],
  ["microsoft-learn-generative-ai-agents", 37],
  ["microsoft-learn-use-ai-everyday-tasks", 43],
  ["microsoft-learn-explore-responsible-ai", 34],
  ["microsoft-learn-embrace-responsible-ai", 51],
  ["microsoft-learn-generative-ai-for-trainers", 156],
  ["microsoft-learn-responsible-ai-education", 162],
  ["microsoft-learn-ai-for-educators", 267],
  ["microsoft-learn-transform-business-ai", 154],
  ["microsoft-learn-healthcare-leaders-ai", 187],
  ["google-introduction-machine-learning", 20],
  ["google-ml-crash-course", 810],
  ["elements-building-ai", null],
  ["nist-ai-rmf-playbook", null]
]);

function assessment(overrides = {}) {
  return {
    assessmentVersion: "phase-2-joint-force-v3",
    practicalFluency: {
      level: { id: "applied-user", label: "Applied user" },
      evidence: []
    },
    technicalOrientation: {
      level: { id: "developer-data-practitioner", label: "Developer or data practitioner" },
      evidence: []
    },
    selections: {
      primaryField: "Intelligence, research, and analysis",
      secondaryFields: [],
      workPatterns: ["analyze-information"],
      learningGoals: ["evaluate-outputs", "research-analysis"],
      weeklyTime: "1-2",
      preferredFormats: ["interactive-lesson"],
      responsibility: "own-tasks",
      ...overrides.selections
    },
    answers: {
      aiResponsibility: "own-tasks",
      ...overrides.answers
    }
  };
}

function pathFor(overrides = {}) {
  return buildLearningPath(
    assessment(overrides),
    catalog,
    practiceCards,
    recommendationConfig
  );
}

test("production catalog contains 12 to 15 verified active external resources", () => {
  const activeExternal = catalog.filter((resource) => resource.active);

  assert.ok(activeExternal.length >= 12);
  assert.ok(activeExternal.length <= 15);

  activeExternal.forEach((resource) => {
    assert.equal(resource.sampleData, false, resource.id);
    assert.match(resource.url, /^https:\/\//, resource.id);
    assert.ok(resource.title, resource.id);
    assert.ok(resource.provider, resource.id);
    assert.ok(resource.evidenceNote, resource.id);
    assert.match(resource.evidenceUrl, /^https:\/\//, resource.id);
    assert.match(resource.sourceUrl, /^https:\/\//, resource.id);
    assert.equal(resource.lastVerifiedAt, "2026-07-18", resource.id);
    assert.equal(resource.lastVerificationDate, "2026-07-18", resource.id);
    assert.match(resource.freeStatusVerification, /Verified/i, resource.id);
    assert.ok(allowedDurationStatuses.has(resource.durationStatus), resource.id);
    assert.equal(resource.durationMinutes, resource.estimatedMinutes, resource.id);
    assert.equal(resource.durationMinutes, expectedDurationMinutes.get(resource.id), resource.id);
    assert.notEqual(resource.verificationStatus, "manual-review", resource.id);
    assert.ok(appConfig.learningPathStages.includes(resource.pathStage), resource.id);
  });
});

test("inactive provisional resources are retained for review but not recommended", () => {
  const inactive = catalog.filter((resource) => resource.active === false);

  assert.ok(inactive.some((resource) => resource.id === "ibm-skillsbuild-ai-fundamentals-provisional"));
  assert.ok(inactive.some((resource) => resource.id === "aws-simulearn-ai-practitioner-provisional"));

  inactive.forEach((resource) => {
    assert.equal(resource.verificationStatus, "manual-review", resource.id);
    assert.match(resource.sourceUrl, /^https:\/\//, resource.id);
    assert.equal(resource.lastVerifiedAt, "2026-07-18", resource.id);
  });
});

test("NIST playbook is represented as a guided reference activity without automatic duration credit", () => {
  const playbook = catalog.find((resource) => resource.id === "nist-ai-rmf-playbook");

  assert.equal(playbook.resourceType, "guided-reference-activity");
  assert.equal(playbook.durationMinutes, null);
  assert.equal(playbook.estimatedMinutes, null);
  assert.match(playbook.durationNote, /Do not credit the full document automatically/i);
  assert.match(playbook.evidenceNote, /internal Pathfinder activity/i);
});

test("internal practice cards are fictional hands-on resources", () => {
  assert.ok(practiceCards.length >= 6);

  practiceCards.forEach((card) => {
    assert.equal(card.provider, "AI Training Pathfinder", card.id);
    assert.equal(card.pathStage, "Hands-on practice", card.id);
    assert.equal(card.formatId, "hands-on-lab", card.id);
    assert.ok(card.fictionalScenario.includes("fictional") || card.fictionalScenario.includes("Fictional"), card.id);
    assert.match(card.safetyReminder, /Do not|Use only|Keep all/i, card.id);
  });
});

test("generated path includes all five required stages with at least one item each", () => {
  const path = pathFor();
  const stageNames = path.stages.map((stage) => stage.stage);

  assert.deepEqual(stageNames, appConfig.learningPathStages);

  path.stages.forEach((stage) => {
    assert.ok(stage.items.length > 0, stage.stage);
    stage.items.forEach((item) => {
      assert.ok(item.reasons.length > 0, item.id);
    });
  });
});

test("analyst profile receives analysis-oriented role-aligned and practice recommendations", () => {
  const path = pathFor({
    selections: {
      primaryField: "Intelligence, research, and analysis",
      workPatterns: ["analyze-information"],
      learningGoals: ["research-analysis", "evaluate-outputs"],
      preferredFormats: ["interactive-lesson"]
    }
  });
  const allItems = path.stages.flatMap((stage) => stage.items);

  assert.ok(allItems.some((item) => item.id === "google-introduction-machine-learning"));
  assert.ok(allItems.some((item) => item.id === "practice-analyst-evaluation-challenge"));
});

test("maintenance profile receives maintenance workflow-support practice", () => {
  const path = pathFor({
    selections: {
      primaryField: "Maintenance",
      workPatterns: ["sustain-optimize", "plan-decide"],
      learningGoals: ["automate-repetitive-tasks", "evaluate-outputs"],
      preferredFormats: ["hands-on-lab"]
    }
  });
  const handsOnStage = path.stages.find((stage) => stage.stage === "Hands-on practice");

  assert.ok(handsOnStage.items.some((item) => item.id === "practice-maintenance-troubleshooting-workflow"));
});

test("logistics profile receives logistics workflow-support practice", () => {
  const path = pathFor({
    selections: {
      primaryField: "Logistics",
      workPatterns: ["sustain-optimize", "plan-decide"],
      learningGoals: ["automate-repetitive-tasks", "work-with-data"],
      preferredFormats: ["hands-on-lab"]
    }
  });
  const handsOnStage = path.stages.find((stage) => stage.stage === "Hands-on practice");

  assert.ok(handsOnStage.items.some((item) => item.id === "practice-logistics-demand-workflow"));
});

test("governance profile receives responsible-use and leadership-aligned content without requiring technical orientation", () => {
  const path = pathFor({
    selections: {
      primaryField: "Leadership, policy, and governance",
      workPatterns: ["lead-govern", "plan-decide"],
      learningGoals: ["responsible-use-risk", "supervise-ai-work"],
      responsibility: "policy-risk",
      preferredFormats: ["reading"]
    },
    answers: {
      aiResponsibility: "policy-risk"
    }
  });
  const allItems = path.stages.flatMap((stage) => stage.items);

  assert.ok(allItems.some((item) => item.id === "nist-ai-rmf-playbook"));
  assert.ok(allItems.some((item) => item.id === "practice-leadership-human-approval"));
});

test("recommendation output does not include progress or completion state", () => {
  const path = pathFor();

  path.stages.flatMap((stage) => stage.items).forEach((item) => {
    assert.equal(Object.hasOwn(item, "completed"), false, item.id);
    assert.equal(Object.hasOwn(item, "startedAt"), false, item.id);
    assert.equal(Object.hasOwn(item, "achievement"), false, item.id);
  });
});
