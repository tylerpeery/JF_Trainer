const COMPLETED_STATUS = "completed";
const STARTED_STATUS = "started";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function itemMinutes(item) {
  return typeof item?.estimatedMinutes === "number" ? item.estimatedMinutes : 0;
}

function completedRecords(state) {
  return Object.values(state?.progress?.resourceStates || {}).filter((record) => {
    return record?.status === COMPLETED_STATUS;
  });
}

function uniqueValues(records, key) {
  return new Set(records.flatMap((record) => asArray(record[key])));
}

function completedForStage(records, stage) {
  return records.some((record) => record.pathStage === stage);
}

function completedForGoal(records, goals) {
  const goalSet = new Set(goals);
  return records.some((record) => asArray(record.learningGoals).some((goal) => goalSet.has(goal)));
}

function completedForPattern(records, patterns) {
  const patternSet = new Set(patterns);
  return records.some((record) => asArray(record.workPatterns).some((pattern) => patternSet.has(pattern)));
}

function qualifiedAchievementIds(state, summary) {
  const records = completedRecords(state);
  const ids = new Set();

  if (state?.assessment) {
    ids.add("path-selected");
  }

  if (summary.completedCount > 0) {
    ids.add("first-step");
  }

  if (completedForStage(records, "AI foundation")) {
    ids.add("foundation-built");
  }

  if (completedForStage(records, "Responsible use and output evaluation")) {
    ids.add("responsible-ai-learner");
  }

  if (completedForGoal(records, ["evaluate-outputs", "responsible-use-risk"])) {
    ids.add("evidence-checker");
  }

  if (completedForPattern(records, ["build-automate", "sustain-optimize"])) {
    ids.add("workflow-designer");
  }

  if (completedForStage(records, "Role-aligned application")) {
    ids.add("role-aligned-learner");
  }

  if (summary.completedHours >= 5) {
    ids.add("adoption-momentum");
  }

  if (summary.completedHours >= 10) {
    ids.add("applied-foundation");
  }

  if (uniqueValues(records, "workPatterns").size > 1) {
    ids.add("cross-functional-learner");
  }

  return ids;
}

export function createTrackableItem(item, type = "resource") {
  return {
    id: item.id,
    type,
    title: item.title,
    provider: item.provider,
    pathStage: item.pathStage || "",
    estimatedMinutes: typeof item.estimatedMinutes === "number" ? item.estimatedMinutes : null,
    durationStatus: item.durationStatus || (typeof item.estimatedMinutes === "number" ? "verified" : "needs-manual-verification"),
    durationNote: item.durationNote || "",
    format: item.format || "",
    sourceUrl: item.url || "",
    workPatterns: asArray(item.workPatterns),
    learningGoals: asArray(item.learningGoals),
    professionalFields: asArray(item.professionalFields),
    tags: asArray(item.tags)
  };
}

export function buildProgressSummary(state, milestones = [], achievementDefinitions = []) {
  const records = completedRecords(state);
  const totalMinutes = records.reduce((sum, record) => sum + itemMinutes(record), 0);
  const completedHours = totalMinutes / 60;
  const milestoneList = asArray(milestones).map((milestone) => ({
    ...milestone,
    earned: milestone.id === "path-selected"
      ? Boolean(state?.assessment)
      : completedHours >= milestone.requiredHours
  }));
  const currentMilestone = milestoneList
    .filter((milestone) => milestone.earned)
    .sort((left, right) => right.requiredHours - left.requiredHours)[0] || null;
  const nextMilestone = milestoneList
    .filter((milestone) => !milestone.earned)
    .sort((left, right) => left.requiredHours - right.requiredHours)[0] || null;
  const summary = {
    startedCount: Object.keys(state?.progress?.resourceStates || {}).length,
    completedCount: records.length,
    totalMinutes,
    completedHours,
    progressPoints: totalMinutes,
    currentMilestone,
    nextMilestone,
    milestones: milestoneList
  };
  const earnedIds = qualifiedAchievementIds(state, summary);
  const earnedAtById = new Map(
    asArray(state?.achievements)
      .filter((achievement) => isObject(achievement) && achievement.id)
      .map((achievement) => [achievement.id, achievement.earnedAt])
  );

  summary.achievements = asArray(achievementDefinitions).map((achievement) => ({
    ...achievement,
    earned: earnedIds.has(achievement.id),
    earnedAt: earnedAtById.get(achievement.id) || null
  }));

  return summary;
}

export function mergeEarnedAchievements(existingAchievements, summary, earnedAt = new Date().toISOString()) {
  const existingById = new Map(
    asArray(existingAchievements)
      .filter((achievement) => isObject(achievement) && achievement.id)
      .map((achievement) => [achievement.id, achievement])
  );

  summary.achievements
    .filter((achievement) => achievement.earned)
    .forEach((achievement) => {
      if (!existingById.has(achievement.id)) {
        existingById.set(achievement.id, {
          id: achievement.id,
          earnedAt
        });
      }
    });

  return Array.from(existingById.values());
}

export function normalizeCompletionInput(input = {}) {
  return {
    completionDate: typeof input.completionDate === "string" ? input.completionDate : "",
    takeaway: typeof input.takeaway === "string" ? input.takeaway.trim().slice(0, 500) : "",
    relevance: typeof input.relevance === "string" ? input.relevance : "",
    difficulty: typeof input.difficulty === "string" ? input.difficulty : ""
  };
}
