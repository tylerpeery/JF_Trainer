import { createDefaultState, normalizeState } from "./local-storage.js";

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasKeys(value) {
  return isObject(value) && Object.keys(value).length > 0;
}

function chooseText(primary, fallback) {
  return typeof primary === "string" && primary ? primary : fallback || "";
}

function chooseTimestamp(primary, fallback) {
  return typeof primary === "string" && primary ? primary : fallback || null;
}

function mergeResourceRecord(accountRecord, guestRecord) {
  if (!accountRecord) {
    return guestRecord;
  }

  const accountCompleted = accountRecord.status === "completed";
  const guestCompleted = guestRecord.status === "completed";
  const completedRecord = guestCompleted && !accountCompleted ? guestRecord : accountRecord;
  const supportingRecord = completedRecord === accountRecord ? guestRecord : accountRecord;

  return {
    ...supportingRecord,
    ...completedRecord,
    id: accountRecord.id || guestRecord.id,
    status: accountCompleted || guestCompleted ? "completed" : accountRecord.status || guestRecord.status,
    startedAt: chooseTimestamp(accountRecord.startedAt, guestRecord.startedAt),
    completedAt: accountCompleted || guestCompleted
      ? chooseTimestamp(accountRecord.completedAt, guestRecord.completedAt)
      : null,
    completionDate: chooseText(accountRecord.completionDate, guestRecord.completionDate),
    takeaway: chooseText(accountRecord.takeaway, guestRecord.takeaway),
    relevance: chooseText(accountRecord.relevance, guestRecord.relevance),
    difficulty: chooseText(accountRecord.difficulty, guestRecord.difficulty),
    updatedAt: chooseTimestamp(accountRecord.updatedAt, guestRecord.updatedAt)
  };
}

function mergeResourceStates(accountResourceStates = {}, guestResourceStates = {}) {
  const merged = { ...accountResourceStates };

  Object.entries(guestResourceStates).forEach(([resourceId, guestRecord]) => {
    merged[resourceId] = mergeResourceRecord(merged[resourceId], guestRecord);
  });

  return merged;
}

function mergeReflection(accountReflection, guestReflection) {
  if (!accountReflection) {
    return guestReflection;
  }

  return {
    usingAiMore: chooseText(accountReflection.usingAiMore, guestReflection.usingAiMore),
    evaluatingOutputConfidence: chooseText(
      accountReflection.evaluatingOutputConfidence,
      guestReflection.evaluatingOutputConfidence
    ),
    nonsensitiveExample: chooseText(accountReflection.nonsensitiveExample, guestReflection.nonsensitiveExample),
    updatedAt: chooseTimestamp(accountReflection.updatedAt, guestReflection.updatedAt)
  };
}

function mergeMilestoneReflections(accountReflections = {}, guestReflections = {}) {
  const merged = { ...accountReflections };

  Object.entries(guestReflections).forEach(([milestoneId, guestReflection]) => {
    merged[milestoneId] = mergeReflection(merged[milestoneId], guestReflection);
  });

  return merged;
}

function mergeAchievements(accountAchievements = [], guestAchievements = []) {
  const byId = new Map();

  [...accountAchievements, ...guestAchievements].forEach((achievement) => {
    if (!achievement?.id) {
      return;
    }

    const existing = byId.get(achievement.id);
    byId.set(achievement.id, {
      id: achievement.id,
      earnedAt: chooseTimestamp(existing?.earnedAt, achievement.earnedAt)
    });
  });

  return Array.from(byId.values());
}

export function hasTransferableGuestState(guestState) {
  const normalizedGuest = normalizeState(guestState).state;

  return Boolean(
    normalizedGuest.assessment ||
    hasKeys(normalizedGuest.progress.resourceStates) ||
    hasKeys(normalizedGuest.progress.milestoneReflections) ||
    normalizedGuest.achievements.length > 0
  );
}

export function mergeGuestStateIntoAccount(accountState, guestState) {
  const defaultState = createDefaultState();
  const normalizedAccount = normalizeState({
    ...defaultState,
    ...accountState,
    mode: "account"
  }).state;
  const normalizedGuest = normalizeState(guestState).state;

  if (!hasTransferableGuestState(normalizedGuest)) {
    return normalizedAccount;
  }

  return normalizeState({
    ...normalizedAccount,
    mode: "account",
    account: normalizedAccount.account,
    assessment: normalizedAccount.assessment || normalizedGuest.assessment,
    progress: {
      resourceStates: mergeResourceStates(
        normalizedAccount.progress.resourceStates,
        normalizedGuest.progress.resourceStates
      ),
      milestoneReflections: mergeMilestoneReflections(
        normalizedAccount.progress.milestoneReflections,
        normalizedGuest.progress.milestoneReflections
      )
    },
    achievements: mergeAchievements(normalizedAccount.achievements, normalizedGuest.achievements),
    updatedAt: new Date().toISOString()
  }).state;
}
