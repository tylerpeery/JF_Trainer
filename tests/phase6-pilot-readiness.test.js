import assert from "node:assert/strict";
import { test } from "node:test";
import { buildProgressSummary } from "../js/progress.js";
import { hasTransferableGuestState, mergeGuestStateIntoAccount } from "../js/storage/guest-transfer.js";
import { createSupabaseAccountAdapter, REPORT_TABLES } from "../js/storage/supabase-account-storage.js";
import { createStorageManager } from "../js/storage/storage-manager.js";

class FakeSupabaseTable {
  constructor(client, tableName) {
    this.client = client;
    this.tableName = tableName;
    this.filters = [];
  }

  select(columns) {
    this.client.calls.push({ action: "select", tableName: this.tableName, columns });
    return this;
  }

  eq(column, value) {
    this.filters.push({ column, value });
    this.client.calls.push({ action: "eq", tableName: this.tableName, column, value });
    return this;
  }

  delete() {
    this.client.calls.push({ action: "delete", tableName: this.tableName });
    return this;
  }

  async maybeSingle() {
    this.client.calls.push({ action: "maybeSingle", tableName: this.tableName, filters: this.filters });
    return { data: this.client.remoteRow, error: null };
  }

  async upsert(payload, options) {
    this.client.calls.push({ action: "upsert", tableName: this.tableName, payload, options });
    this.client.upserts.set(this.tableName, payload);
    return { error: null };
  }
}

class FakeSupabaseClient {
  constructor(remoteRow = null) {
    this.remoteRow = remoteRow;
    this.calls = [];
    this.upserts = new Map();
  }

  from(tableName) {
    this.calls.push({ action: "from", tableName });
    return new FakeSupabaseTable(this, tableName);
  }
}

const user = { id: "00000000-0000-4000-8000-000000000456" };

const assessment = {
  assessmentVersion: "phase-2-joint-force-v2",
  completedAt: "2026-07-18T00:00:00.000Z",
  practicalFluency: {
    level: { id: "foundational-user", label: "Foundational user" },
    evidence: ["Uses simple AI tasks."]
  },
  technicalOrientation: {
    level: { id: "general-user", label: "General user" },
    evidence: ["Primarily uses ordinary workplace software."]
  },
  answers: { primaryField: "Healthcare" },
  selections: {}
};

const accountResource = {
  id: "shared-resource",
  type: "resource",
  title: "Shared resource",
  provider: "Provider",
  pathStage: "AI foundation",
  estimatedMinutes: 30,
  durationStatus: "verified",
  status: "started",
  startedAt: "2026-07-18T10:00:00.000Z",
  completedAt: null,
  completionDate: "",
  takeaway: "",
  relevance: "",
  difficulty: "",
  updatedAt: "2026-07-18T10:00:00.000Z"
};

const guestCompletedResource = {
  ...accountResource,
  status: "completed",
  completedAt: "2026-07-18T11:00:00.000Z",
  completionDate: "2026-07-18",
  takeaway: "Nonsensitive guest note",
  relevance: "4",
  difficulty: "appropriate",
  updatedAt: "2026-07-18T11:00:00.000Z"
};

const guestSecondResource = {
  ...accountResource,
  id: "guest-only-resource",
  title: "Guest-only resource",
  estimatedMinutes: 45,
  status: "completed",
  completedAt: "2026-07-18T12:00:00.000Z",
  updatedAt: "2026-07-18T12:00:00.000Z"
};

test("empty guest state is not offered for account import", () => {
  assert.equal(hasTransferableGuestState({ version: 1, mode: "guest" }), false);
});

test("guest import preserves progress and deduplicates resource and achievement IDs", () => {
  const accountState = {
    version: 1,
    mode: "account",
    account: { userId: user.id },
    assessment: null,
    progress: {
      resourceStates: {
        "shared-resource": accountResource
      },
      milestoneReflections: {
        "adoption-momentum": {
          usingAiMore: "yes",
          evaluatingOutputConfidence: "",
          nonsensitiveExample: "",
          updatedAt: "2026-07-18T10:00:00.000Z"
        }
      }
    },
    achievements: [{ id: "first-step", earnedAt: "2026-07-18T10:00:00.000Z" }]
  };
  const guestState = {
    version: 1,
    mode: "guest",
    assessment,
    progress: {
      resourceStates: {
        "shared-resource": guestCompletedResource,
        "guest-only-resource": guestSecondResource
      },
      milestoneReflections: {
        "adoption-momentum": {
          usingAiMore: "",
          evaluatingOutputConfidence: "yes",
          nonsensitiveExample: "Fictional nonsensitive example.",
          updatedAt: "2026-07-18T12:00:00.000Z"
        }
      }
    },
    achievements: [
      { id: "first-step", earnedAt: "2026-07-18T11:00:00.000Z" },
      { id: "role-aligned-learner", earnedAt: "2026-07-18T12:00:00.000Z" }
    ]
  };

  const merged = mergeGuestStateIntoAccount(accountState, guestState);
  const summary = buildProgressSummary(merged);

  assert.equal(merged.mode, "account");
  assert.equal(merged.account.userId, user.id);
  assert.equal(merged.assessment.answers.primaryField, "Healthcare");
  assert.equal(Object.keys(merged.progress.resourceStates).length, 2);
  assert.equal(merged.progress.resourceStates["shared-resource"].status, "completed");
  assert.equal(merged.progress.resourceStates["shared-resource"].takeaway, "Nonsensitive guest note");
  assert.equal(merged.progress.milestoneReflections["adoption-momentum"].usingAiMore, "yes");
  assert.equal(merged.progress.milestoneReflections["adoption-momentum"].evaluatingOutputConfidence, "yes");
  assert.equal(merged.achievements.filter((achievement) => achievement.id === "first-step").length, 1);
  assert.equal(merged.achievements.find((achievement) => achievement.id === "first-step").earnedAt, "2026-07-18T10:00:00.000Z");
  assert.equal(summary.completedCount, 2);
  assert.equal(summary.totalMinutes, 75);
});

test("guest import through account storage updates snapshot and normalized report tables", async () => {
  const client = new FakeSupabaseClient({
    state: {
      version: 1,
      mode: "account",
      account: { userId: user.id },
      progress: {
        resourceStates: {
          "shared-resource": accountResource
        }
      },
      achievements: []
    }
  });
  const adapter = createSupabaseAccountAdapter({ client, user });
  const storageManager = createStorageManager(adapter);
  await adapter.loadRemoteState();

  storageManager.importGuestState({
    version: 1,
    mode: "guest",
    assessment,
    progress: {
      resourceStates: {
        "shared-resource": guestCompletedResource,
        "guest-only-resource": guestSecondResource
      }
    },
    achievements: [{ id: "first-step", earnedAt: "2026-07-18T11:00:00.000Z" }]
  });
  await storageManager.flush();

  const progressRows = client.upserts.get(REPORT_TABLES.resourceProgress);
  const assessmentRows = client.upserts.get(REPORT_TABLES.assessmentResults);
  const achievementRows = client.upserts.get(REPORT_TABLES.earnedAchievements);

  assert.equal(progressRows.length, 2);
  assert.equal(progressRows.filter((row) => row.resource_id === "shared-resource").length, 1);
  assert.equal(progressRows.find((row) => row.resource_id === "shared-resource").status, "completed");
  assert.equal(assessmentRows[0].user_id, user.id);
  assert.equal(achievementRows.filter((row) => row.achievement_id === "first-step").length, 1);
});
