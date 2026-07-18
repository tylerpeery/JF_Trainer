import assert from "node:assert/strict";
import { test } from "node:test";
import { buildProgressSummary } from "../js/progress.js";
import { createLocalStorageAdapter } from "../js/storage/local-storage.js";
import { createStorageManager } from "../js/storage/storage-manager.js";

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, value);
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

const milestones = [
  { id: "path-selected", name: "Path Selected", requiredHours: 0, description: "Assessment complete." },
  { id: "orientation-complete", name: "Orientation Complete", requiredHours: 1, description: "One hour." },
  { id: "adoption-momentum", name: "Adoption Momentum", requiredHours: 5, description: "Five hours." },
  { id: "applied-foundation", name: "Applied Foundation", requiredHours: 10, description: "Ten hours." }
];

const achievements = [
  { id: "path-selected", name: "Path Selected", description: "Complete the assessment." },
  { id: "first-step", name: "First Step", description: "Complete one activity." },
  { id: "foundation-built", name: "Foundation Built", description: "Complete foundation learning." },
  { id: "adoption-momentum", name: "Adoption Momentum", description: "Reach five hours." },
  { id: "applied-foundation", name: "Applied Foundation", description: "Reach ten hours." }
];

const item = {
  id: "resource-one",
  title: "Resource one",
  provider: "Provider",
  pathStage: "AI foundation",
  estimatedMinutes: 60,
  format: "Interactive lesson",
  url: "https://example.test/resource-one",
  workPatterns: ["analyze-information"],
  learningGoals: ["ai-terminology-capabilities"],
  professionalFields: ["All fields"],
  tags: ["ai-foundation"],
  active: true
};

const longItem = {
  ...item,
  id: "resource-long",
  title: "Long resource",
  pathStage: "Optional deeper learning",
  estimatedMinutes: 540
};

function manager() {
  return createStorageManager(createLocalStorageAdapter(new MemoryStorage()));
}

function saveAssessment(storageManager) {
  storageManager.saveAssessmentResult({
    assessmentVersion: "phase-2-joint-force-v2",
    completedAt: "2026-07-18T00:00:00.000Z",
    practicalFluency: {
      level: { id: "applied-user", label: "Applied user" },
      evidence: []
    },
    technicalOrientation: {
      level: { id: "developer-data-practitioner", label: "Developer or data practitioner" },
      evidence: []
    },
    answers: {},
    selections: {}
  });
}

test("completion cannot double-count time, points, or achievements", () => {
  const storageManager = manager();

  saveAssessment(storageManager);
  storageManager.completeResource(item, "resource", {}, milestones, achievements);
  storageManager.completeResource(item, "resource", {}, milestones, achievements);

  const summary = buildProgressSummary(storageManager.getSnapshot().state, milestones, achievements);
  const earnedIds = storageManager.getSnapshot().state.achievements.map((achievement) => achievement.id);

  assert.equal(summary.completedCount, 1);
  assert.equal(summary.totalMinutes, 60);
  assert.equal(summary.progressPoints, 60);
  assert.equal(earnedIds.filter((id) => id === "first-step").length, 1);
});

test("path selected milestone requires an assessment even though it has zero hours", () => {
  const storageManager = manager();
  let summary = buildProgressSummary(storageManager.getSnapshot().state, milestones, achievements);
  let pathSelected = summary.milestones.find((milestone) => milestone.id === "path-selected");

  assert.equal(pathSelected.earned, false);

  saveAssessment(storageManager);
  summary = buildProgressSummary(storageManager.getSnapshot().state, milestones, achievements);
  pathSelected = summary.milestones.find((milestone) => milestone.id === "path-selected");

  assert.equal(pathSelected.earned, true);
});

test("undo removes completion credit and re-completion restores only one item of credit", () => {
  const storageManager = manager();

  storageManager.completeResource(item, "resource", {}, milestones, achievements);
  storageManager.undoResourceCompletion(item.id, milestones, achievements);
  let summary = buildProgressSummary(storageManager.getSnapshot().state, milestones, achievements);

  assert.equal(summary.completedCount, 0);
  assert.equal(summary.totalMinutes, 0);

  storageManager.completeResource(item, "resource", {}, milestones, achievements);
  summary = buildProgressSummary(storageManager.getSnapshot().state, milestones, achievements);

  assert.equal(summary.completedCount, 1);
  assert.equal(summary.totalMinutes, 60);
});

test("milestones and progress do not change assessment expertise dimensions", () => {
  const storageManager = manager();

  saveAssessment(storageManager);
  storageManager.completeResource(item, "resource", {}, milestones, achievements);
  storageManager.completeResource(longItem, "resource", {}, milestones, achievements);

  const state = storageManager.getSnapshot().state;
  const summary = buildProgressSummary(state, milestones, achievements);

  assert.equal(summary.completedHours, 10);
  assert.equal(state.assessment.practicalFluency.level.id, "applied-user");
  assert.equal(state.assessment.technicalOrientation.level.id, "developer-data-practitioner");
});

test("optional completion metadata and milestone reflections are saved without required free text", () => {
  const storageManager = manager();

  storageManager.completeResource(item, "resource", {
    completionDate: "2026-07-18",
    takeaway: "",
    relevance: "5",
    difficulty: "appropriate"
  }, milestones, achievements);
  storageManager.saveMilestoneReflection("adoption-momentum", {
    usingAiMore: "",
    evaluatingOutputConfidence: "not-sure",
    nonsensitiveExample: ""
  });

  const state = storageManager.getSnapshot().state;

  assert.equal(state.progress.resourceStates[item.id].completionDate, "2026-07-18");
  assert.equal(state.progress.resourceStates[item.id].takeaway, "");
  assert.equal(state.progress.resourceStates[item.id].relevance, "5");
  assert.equal(state.progress.milestoneReflections["adoption-momentum"].usingAiMore, "");
});

test("export and reset work for guest mode", () => {
  const storageManager = manager();

  storageManager.startGuestSession();
  storageManager.completeResource(item, "resource", {}, milestones, achievements);

  const exported = JSON.parse(storageManager.exportGuestData());
  assert.equal(exported.progress.resourceStates[item.id].status, "completed");

  storageManager.resetGuestData();
  const state = storageManager.getSnapshot().state;

  assert.equal(state.activeView, "home");
  assert.deepEqual(state.progress.resourceStates, {});
  assert.deepEqual(state.achievements, []);
});

test("corrupted progress records are discarded without crashing", () => {
  const storage = new MemoryStorage();
  const adapter = createLocalStorageAdapter(storage);
  const storageManager = createStorageManager(adapter);

  adapter.save({
    version: 1,
    mode: "guest",
    activeView: "progress",
    progress: {
      resourceStates: {
        broken: null,
        "resource-one": { ...item, id: "resource-one", status: "completed", completedAt: "2026-07-18T00:00:00.000Z" }
      }
    },
    achievements: [
      { id: "first-step", earnedAt: "2026-07-18T00:00:00.000Z" },
      { id: "first-step", earnedAt: "2026-07-18T00:00:00.000Z" }
    ]
  });

  const state = storageManager.getSnapshot().state;

  assert.equal(Object.keys(state.progress.resourceStates).length, 1);
  assert.equal(state.achievements.length, 1);
});
