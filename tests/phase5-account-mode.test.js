import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { getAuthRedirectUrl, isSupabaseConfigured } from "../js/supabase-client.js";
import {
  ACCOUNT_STATE_TABLE,
  REPORT_TABLES,
  createReportTableRows,
  createSupabaseAccountAdapter
} from "../js/storage/supabase-account-storage.js";
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
    this.client.upserted = payload;
    this.client.upserts.set(this.tableName, payload);
    return { error: null };
  }
}

class FakeSupabaseClient {
  constructor(remoteRow = null) {
    this.remoteRow = remoteRow;
    this.calls = [];
    this.upserted = null;
    this.upserts = new Map();
  }

  from(tableName) {
    this.calls.push({ action: "from", tableName });
    return new FakeSupabaseTable(this, tableName);
  }
}

const user = { id: "00000000-0000-4000-8000-000000000123" };
const assessment = {
  assessmentVersion: "phase-2-joint-force-v3",
  completedAt: "2026-07-18T00:00:00.000Z",
  practicalFluency: {
    level: { id: "foundational-user", label: "Foundational user" },
    evidence: []
  },
  technicalOrientation: {
    level: { id: "general-user", label: "General user" },
    evidence: []
  },
  answers: {},
  selections: {}
};

const item = {
  id: "resource-one",
  title: "Resource one",
  provider: "Provider",
  pathStage: "AI foundation",
  estimatedMinutes: 20,
  format: "Interactive lesson",
  url: "https://example.test/resource-one",
  workPatterns: ["analyze-information"],
  learningGoals: ["ai-terminology-capabilities"],
  professionalFields: ["All fields"],
  tags: ["ai-foundation"],
  active: true
};

function createAccountManager(remoteRow = null) {
  const client = new FakeSupabaseClient(remoteRow);
  const adapter = createSupabaseAccountAdapter({ client, user });
  const storageManager = createStorageManager(adapter);
  return { adapter, client, storageManager };
}

test("Supabase account adapter loads only the authenticated user's state row", async () => {
  const { adapter, client } = createAccountManager({ state: { activeView: "progress" } });

  const loaded = await adapter.loadRemoteState();

  assert.equal(loaded.state.mode, "account");
  assert.equal(loaded.state.activeView, "progress");
  assert.deepEqual(
    client.calls.filter((call) => call.action === "eq"),
    [{ action: "eq", tableName: ACCOUNT_STATE_TABLE, column: "user_id", value: user.id }]
  );
});

test("Supabase account adapter saves assessment, progress, feedback, achievements, and reflections", async () => {
  const { adapter, client, storageManager } = createAccountManager();

  storageManager.saveAssessmentResult(assessment);
  storageManager.saveAssessmentAccuracyFeedback("seems-accurate");
  storageManager.completeResource(item, "resource", {
    completionDate: "2026-07-18",
    takeaway: "Nonsensitive takeaway",
    relevance: "5",
    difficulty: "appropriate"
  }, [], [{ id: "first-step", name: "First Step", description: "Complete one item." }]);
  storageManager.saveMilestoneReflection("adoption-momentum", {
    usingAiMore: "yes",
    evaluatingOutputConfidence: "not-sure",
    nonsensitiveExample: ""
  });
  await adapter.flush();

  const stateUpsert = client.upserts.get(ACCOUNT_STATE_TABLE);
  assert.equal(stateUpsert.user_id, user.id);
  assert.equal(stateUpsert.state.mode, "account");
  assert.equal(stateUpsert.state.assessment.practicalFluency.level.id, "foundational-user");
  assert.equal(stateUpsert.state.assessment.accuracyFeedback.value, "seems-accurate");
  assert.equal(stateUpsert.state.progress.resourceStates[item.id].status, "completed");
  assert.equal(stateUpsert.state.progress.resourceStates[item.id].takeaway, "Nonsensitive takeaway");
  assert.equal(stateUpsert.state.progress.milestoneReflections["adoption-momentum"].usingAiMore, "yes");
  assert.equal(stateUpsert.state.achievements.filter((achievement) => achievement.id === "first-step").length, 1);

  const profileRows = client.upserts.get(REPORT_TABLES.profiles);
  const assessmentRows = client.upserts.get(REPORT_TABLES.assessmentResults);
  const progressRows = client.upserts.get(REPORT_TABLES.resourceProgress);
  const feedbackRows = client.upserts.get(REPORT_TABLES.completionFeedback);
  const reflectionRows = client.upserts.get(REPORT_TABLES.milestoneReflections);
  const achievementRows = client.upserts.get(REPORT_TABLES.earnedAchievements);

  assert.equal(profileRows[0].user_id, user.id);
  assert.equal(profileRows[0].practical_fluency_id, "foundational-user");
  assert.equal(profileRows[0].profile_accuracy_feedback, "seems-accurate");
  assert.deepEqual(assessmentRows[0].practical_fluency_evidence, []);
  assert.equal(progressRows[0].resource_id, item.id);
  assert.equal(progressRows[0].estimated_minutes, 20);
  assert.equal(feedbackRows[0].takeaway, "Nonsensitive takeaway");
  assert.equal(feedbackRows[0].relevance, 5);
  assert.equal(reflectionRows[0].milestone_id, "adoption-momentum");
  assert.equal(achievementRows[0].achievement_id, "first-step");

  const deletedReportTables = client.calls
    .filter((call) => call.action === "delete")
    .map((call) => call.tableName);
  assert.deepEqual(new Set(deletedReportTables), new Set(Object.values(REPORT_TABLES)));
});

test("report table row builder omits report rows when account state is reset", () => {
  const rows = createReportTableRows({
    mode: "account",
    assessment: null,
    progress: {
      resourceStates: {},
      milestoneReflections: {}
    },
    achievements: []
  }, user.id);

  assert.deepEqual(rows[REPORT_TABLES.profiles], []);
  assert.deepEqual(rows[REPORT_TABLES.assessmentResults], []);
  assert.deepEqual(rows[REPORT_TABLES.resourceProgress], []);
  assert.deepEqual(rows[REPORT_TABLES.completionFeedback], []);
  assert.deepEqual(rows[REPORT_TABLES.milestoneReflections], []);
  assert.deepEqual(rows[REPORT_TABLES.earnedAchievements], []);
});

test("guest storage still works without Supabase", () => {
  const storageManager = createStorageManager(createLocalStorageAdapter(new MemoryStorage()));

  storageManager.startGuestSession();
  storageManager.saveAssessmentResult(assessment);

  const state = storageManager.getSnapshot().state;
  assert.equal(state.mode, "guest");
  assert.equal(state.assessment.technicalOrientation.level.id, "general-user");
});

test("Supabase configuration requires enabled flag, HTTPS URL, and browser-safe key length", () => {
  assert.equal(isSupabaseConfigured({ enabled: false }), false);
  assert.equal(isSupabaseConfigured({ enabled: true, supabaseUrl: "http://localhost", supabaseAnonKey: "short" }), false);
  assert.equal(isSupabaseConfigured({
    enabled: true,
    supabaseUrl: "https://example.supabase.co",
    supabasePublishableKey: "sb_publishable_key_that_is_long_enough"
  }), true);
});

test("auth redirect URL resolves from a GitHub Pages subdirectory", () => {
  const redirect = getAuthRedirectUrl(
    { authRedirectPath: "./" },
    { href: "https://example.github.io/pathfinder/index.html" }
  );

  assert.equal(redirect, "https://example.github.io/pathfinder/");
});

test("auth redirect URL resolves from local static server root", () => {
  const redirect = getAuthRedirectUrl(
    { authRedirectPath: "./" },
    { href: "http://localhost:8000/index.html" }
  );

  assert.equal(redirect, "http://localhost:8000/");
});

test("RLS SQL restricts account state rows to auth.uid", async () => {
  const sql = await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");

  assert.match(sql, /revoke all on public\.pathfinder_user_states from anon/i);
  assert.match(sql, /revoke all on public\.pathfinder_user_states from public/i);
  assert.match(sql, /alter table public\.pathfinder_user_states enable row level security/i);
  assert.match(sql, /for select[\s\S]*using \(auth\.uid\(\) = user_id\)/i);
  assert.match(sql, /for insert[\s\S]*with check \(auth\.uid\(\) = user_id\)/i);
  assert.match(sql, /for update[\s\S]*using \(auth\.uid\(\) = user_id\)[\s\S]*with check \(auth\.uid\(\) = user_id\)/i);
  assert.match(sql, /for delete[\s\S]*using \(auth\.uid\(\) = user_id\)/i);
});

test("RLS SQL restricts every report table to auth.uid", async () => {
  const sql = await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");

  Object.values(REPORT_TABLES).forEach((tableName) => {
    assert.match(sql, new RegExp(`revoke all on public\\.${tableName} from anon`, "i"));
    assert.match(sql, new RegExp(`revoke all on public\\.${tableName} from public`, "i"));
    assert.match(sql, new RegExp(`alter table public\\.${tableName} enable row level security`, "i"));
    assert.match(sql, new RegExp(`on public\\.${tableName}[\\s\\S]*for select[\\s\\S]*using \\(auth\\.uid\\(\\) = user_id\\)`, "i"));
    assert.match(sql, new RegExp(`on public\\.${tableName}[\\s\\S]*for insert[\\s\\S]*with check \\(auth\\.uid\\(\\) = user_id\\)`, "i"));
    assert.match(sql, new RegExp(`on public\\.${tableName}[\\s\\S]*for update[\\s\\S]*using \\(auth\\.uid\\(\\) = user_id\\)[\\s\\S]*with check \\(auth\\.uid\\(\\) = user_id\\)`, "i"));
    assert.match(sql, new RegExp(`on public\\.${tableName}[\\s\\S]*for delete[\\s\\S]*using \\(auth\\.uid\\(\\) = user_id\\)`, "i"));
  });
});
