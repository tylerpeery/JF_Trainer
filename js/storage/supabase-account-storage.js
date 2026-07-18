import { createDefaultState, normalizeState } from "./local-storage.js";

export const ACCOUNT_STATE_TABLE = "pathfinder_user_states";
export const REPORT_TABLES = {
  profiles: "pathfinder_user_profiles",
  assessmentResults: "pathfinder_assessment_results",
  resourceProgress: "pathfinder_resource_progress",
  completionFeedback: "pathfinder_completion_feedback",
  milestoneReflections: "pathfinder_milestone_reflections",
  earnedAchievements: "pathfinder_earned_achievements"
};

function accountMetadata(user) {
  return {
    userId: user.id,
    signedInAt: new Date().toISOString()
  };
}

function accountState(state, user) {
  const defaultState = createDefaultState();

  return normalizeState({
    ...defaultState,
    ...state,
    progress: state.progress || defaultState.progress,
    achievements: Array.isArray(state.achievements) ? state.achievements : defaultState.achievements,
    mode: "account",
    account: accountMetadata(user)
  }).state;
}

function safeErrorMessage(error, fallback) {
  if (!error) {
    return null;
  }

  return error.message || fallback;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function nullable(value) {
  return value === "" || value === undefined ? null : value;
}

function relevanceValue(value) {
  const number = Number.parseInt(value, 10);
  return Number.isInteger(number) ? number : null;
}

function progressRows(state, userId) {
  return Object.values(state.progress.resourceStates || {}).map((record) => ({
    user_id: userId,
    resource_id: record.id,
    resource_type: record.type || "resource",
    title: record.title,
    provider: record.provider,
    path_stage: record.pathStage || null,
    status: record.status,
    started_at: nullable(record.startedAt),
    completed_at: nullable(record.completedAt),
    completion_date: nullable(record.completionDate),
    estimated_minutes: typeof record.estimatedMinutes === "number" ? record.estimatedMinutes : null,
    duration_status: record.durationStatus || null,
    format: record.format || null,
    source_url: record.sourceUrl || null,
    work_patterns: asArray(record.workPatterns),
    learning_goals: asArray(record.learningGoals),
    professional_fields: asArray(record.professionalFields),
    tags: asArray(record.tags),
    updated_at: nullable(record.updatedAt) || new Date().toISOString()
  }));
}

function feedbackRows(state, userId) {
  return Object.values(state.progress.resourceStates || {})
    .filter((record) => record.takeaway || record.relevance || record.difficulty)
    .map((record) => ({
      user_id: userId,
      resource_id: record.id,
      takeaway: record.takeaway || null,
      relevance: relevanceValue(record.relevance),
      difficulty: record.difficulty || null,
      updated_at: nullable(record.updatedAt) || new Date().toISOString()
    }));
}

function reflectionRows(state, userId) {
  return Object.entries(state.progress.milestoneReflections || {}).map(([milestoneId, reflection]) => ({
    user_id: userId,
    milestone_id: milestoneId,
    using_ai_more: reflection.usingAiMore || null,
    evaluating_output_confidence: reflection.evaluatingOutputConfidence || null,
    nonsensitive_example: reflection.nonsensitiveExample || null,
    updated_at: nullable(reflection.updatedAt) || new Date().toISOString()
  }));
}

function achievementRows(state, userId) {
  return asArray(state.achievements).map((achievement) => ({
    user_id: userId,
    achievement_id: achievement.id,
    earned_at: nullable(achievement.earnedAt),
    updated_at: new Date().toISOString()
  }));
}

function profileRows(state, userId) {
  if (!state.assessment) {
    return [];
  }

  const answers = state.assessment.answers || {};
  const accuracyFeedback = state.assessment.accuracyFeedback || null;

  return [{
    user_id: userId,
    assessment_completed_at: nullable(state.assessment.completedAt),
    practical_fluency_id: state.assessment.practicalFluency?.level?.id || null,
    practical_fluency_label: state.assessment.practicalFluency?.level?.label || null,
    technical_orientation_id: state.assessment.technicalOrientation?.level?.id || null,
    technical_orientation_label: state.assessment.technicalOrientation?.level?.label || null,
    primary_field: answers.primaryField || null,
    secondary_fields: asArray(answers.secondaryFields),
    work_patterns: asArray(answers.workPatterns),
    learning_goals: asArray(answers.learningGoals),
    weekly_time: answers.weeklyTime || null,
    preferred_formats: asArray(answers.preferredFormats),
    ai_responsibility: answers.aiResponsibility || null,
    profile_accuracy_feedback: accuracyFeedback?.value || null,
    profile_accuracy_feedback_at: nullable(accuracyFeedback?.updatedAt),
    updated_at: new Date().toISOString()
  }];
}

function assessmentRows(state, userId) {
  if (!state.assessment) {
    return [];
  }

  return [{
    user_id: userId,
    assessment_version: state.assessment.assessmentVersion || null,
    completed_at: nullable(state.assessment.completedAt),
    answers: state.assessment.answers || {},
    selections: state.assessment.selections || {},
    practical_fluency_evidence: asArray(state.assessment.practicalFluency?.evidence),
    technical_orientation_evidence: asArray(state.assessment.technicalOrientation?.evidence),
    accuracy_feedback: state.assessment.accuracyFeedback || null,
    updated_at: new Date().toISOString()
  }];
}

export function createReportTableRows(state, userId) {
  return {
    [REPORT_TABLES.profiles]: profileRows(state, userId),
    [REPORT_TABLES.assessmentResults]: assessmentRows(state, userId),
    [REPORT_TABLES.resourceProgress]: progressRows(state, userId),
    [REPORT_TABLES.completionFeedback]: feedbackRows(state, userId),
    [REPORT_TABLES.milestoneReflections]: reflectionRows(state, userId),
    [REPORT_TABLES.earnedAchievements]: achievementRows(state, userId)
  };
}

export function createSupabaseAccountAdapter({
  client,
  user,
  initialState = createDefaultState()
}) {
  let cachedState = accountState(initialState, user);
  let lastError = null;
  let pendingSave = Promise.resolve();

  function load() {
    return {
      state: cachedState,
      recoverableError: lastError
    };
  }

  function persist(state) {
    pendingSave = pendingSave.then(async () => {
      const { error } = await client
        .from(ACCOUNT_STATE_TABLE)
        .upsert(
          {
            user_id: user.id,
            state,
            updated_at: new Date().toISOString()
          },
          { onConflict: "user_id" }
        );

      if (error) {
        lastError = safeErrorMessage(error, "Account data could not be saved.");
        return;
      }

      await syncReportTables(state);
      lastError = null;
    }).catch((error) => {
      lastError = safeErrorMessage(error, "Account data could not be saved.");
    });

    return pendingSave;
  }

  async function replaceUserRows(tableName, rows, onConflict) {
    const deleteResult = await client
      .from(tableName)
      .delete()
      .eq("user_id", user.id);

    if (deleteResult.error) {
      throw deleteResult.error;
    }

    if (rows.length === 0) {
      return;
    }

    const insertResult = await client
      .from(tableName)
      .upsert(rows, { onConflict });

    if (insertResult.error) {
      throw insertResult.error;
    }
  }

  async function syncReportTables(state) {
    const rowsByTable = createReportTableRows(state, user.id);
    await replaceUserRows(REPORT_TABLES.profiles, rowsByTable[REPORT_TABLES.profiles], "user_id");
    await replaceUserRows(REPORT_TABLES.assessmentResults, rowsByTable[REPORT_TABLES.assessmentResults], "user_id");
    await replaceUserRows(REPORT_TABLES.resourceProgress, rowsByTable[REPORT_TABLES.resourceProgress], "user_id,resource_id");
    await replaceUserRows(REPORT_TABLES.completionFeedback, rowsByTable[REPORT_TABLES.completionFeedback], "user_id,resource_id");
    await replaceUserRows(REPORT_TABLES.milestoneReflections, rowsByTable[REPORT_TABLES.milestoneReflections], "user_id,milestone_id");
    await replaceUserRows(REPORT_TABLES.earnedAchievements, rowsByTable[REPORT_TABLES.earnedAchievements], "user_id,achievement_id");
  }

  function save(state) {
    cachedState = {
      ...accountState(state, user),
      updatedAt: new Date().toISOString()
    };
    lastError = null;
    persist(cachedState);

    return {
      state: cachedState,
      recoverableError: null
    };
  }

  function update(updater) {
    const current = load();
    const saved = save(updater(current.state));

    return {
      state: saved.state,
      recoverableError: current.recoverableError || saved.recoverableError
    };
  }

  function reset() {
    return save(createDefaultState({
      mode: "account",
      activeView: "home",
      account: accountMetadata(user)
    }));
  }

  function exportJson() {
    return JSON.stringify(load().state, null, 2);
  }

  async function loadRemoteState() {
    const query = client
      .from(ACCOUNT_STATE_TABLE)
      .select("state")
      .eq("user_id", user.id);
    const { data, error } = await query.maybeSingle();

    if (error) {
      lastError = safeErrorMessage(error, "Account data could not be loaded.");
      cachedState = accountState(initialState, user);
      return load();
    }

    cachedState = accountState(data?.state || initialState, user);
    lastError = null;
    return load();
  }

  async function flush() {
    await pendingSave;
    return load();
  }

  return {
    load,
    save,
    update,
    reset,
    exportJson,
    loadRemoteState,
    flush,
    getUserId: () => user.id
  };
}
