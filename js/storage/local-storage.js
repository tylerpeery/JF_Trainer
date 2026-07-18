const STORAGE_KEY = "ai-training-pathfinder:guest-state:v1";
const CURRENT_VERSION = 1;
export const SUPPORTED_ASSESSMENT_VERSION = "phase-2-joint-force-v2";

function createDefaultState() {
  return {
    version: CURRENT_VERSION,
    mode: "guest",
    activeView: "home",
    guestStartedAt: null,
    assessment: null,
    progress: {
      resourceStates: {}
    },
    achievements: [],
    updatedAt: null
  };
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeAssessment(value) {
  if (!isObject(value)) {
    return null;
  }

  if (value.assessmentVersion !== SUPPORTED_ASSESSMENT_VERSION) {
    return null;
  }

  if (
    !isObject(value.practicalFluency) ||
    !isObject(value.technicalOrientation) ||
    !Array.isArray(value.practicalFluency.evidence) ||
    !Array.isArray(value.technicalOrientation.evidence) ||
    !isObject(value.answers)
  ) {
    return null;
  }

  return {
    ...value,
    selections: isObject(value.selections) ? value.selections : {},
    accuracyFeedback: isObject(value.accuracyFeedback) ? value.accuracyFeedback : null
  };
}

function normalizeResourceState(value, fallbackId = "") {
  if (!isObject(value)) {
    return null;
  }

  const id = typeof value.id === "string" && value.id ? value.id : fallbackId;

  if (!id) {
    return null;
  }

  const status = value.status === "completed" ? "completed" : "started";

  return {
    id,
    type: typeof value.type === "string" ? value.type : "resource",
    title: typeof value.title === "string" ? value.title : "Untitled resource",
    provider: typeof value.provider === "string" ? value.provider : "Unknown provider",
    pathStage: typeof value.pathStage === "string" ? value.pathStage : "",
    estimatedMinutes: typeof value.estimatedMinutes === "number" ? value.estimatedMinutes : null,
    durationStatus: typeof value.durationStatus === "string" ? value.durationStatus : "needs-manual-verification",
    durationNote: typeof value.durationNote === "string" ? value.durationNote : "",
    format: typeof value.format === "string" ? value.format : "",
    sourceUrl: typeof value.sourceUrl === "string" ? value.sourceUrl : "",
    workPatterns: Array.isArray(value.workPatterns) ? value.workPatterns : [],
    learningGoals: Array.isArray(value.learningGoals) ? value.learningGoals : [],
    professionalFields: Array.isArray(value.professionalFields) ? value.professionalFields : [],
    tags: Array.isArray(value.tags) ? value.tags : [],
    status,
    startedAt: typeof value.startedAt === "string" ? value.startedAt : null,
    completedAt: status === "completed" && typeof value.completedAt === "string" ? value.completedAt : null,
    completionDate: typeof value.completionDate === "string" ? value.completionDate : "",
    takeaway: typeof value.takeaway === "string" ? value.takeaway : "",
    relevance: typeof value.relevance === "string" ? value.relevance : "",
    difficulty: typeof value.difficulty === "string" ? value.difficulty : "",
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null
  };
}

function normalizeProgress(value) {
  if (!isObject(value)) {
    return createDefaultState().progress;
  }

  const resourceStates = Object.fromEntries(
    Object.entries(isObject(value.resourceStates) ? value.resourceStates : {})
      .map(([id, record]) => [id, normalizeResourceState(record, id)])
      .filter(([id, record]) => record && id === record.id)
  );

  const milestoneReflections = Object.fromEntries(
    Object.entries(isObject(value.milestoneReflections) ? value.milestoneReflections : {})
      .filter(([id, reflection]) => typeof id === "string" && isObject(reflection))
      .map(([id, reflection]) => [
        id,
        {
          usingAiMore: typeof reflection.usingAiMore === "string" ? reflection.usingAiMore : "",
          evaluatingOutputConfidence: typeof reflection.evaluatingOutputConfidence === "string"
            ? reflection.evaluatingOutputConfidence
            : "",
          nonsensitiveExample: typeof reflection.nonsensitiveExample === "string"
            ? reflection.nonsensitiveExample
            : "",
          updatedAt: typeof reflection.updatedAt === "string" ? reflection.updatedAt : null
        }
      ])
  );

  return {
    resourceStates,
    milestoneReflections
  };
}

function normalizeAchievements(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set();

  return value
    .filter((achievement) => isObject(achievement) && typeof achievement.id === "string" && achievement.id)
    .filter((achievement) => {
      if (seen.has(achievement.id)) {
        return false;
      }

      seen.add(achievement.id);
      return true;
    })
    .map((achievement) => ({
      id: achievement.id,
      earnedAt: typeof achievement.earnedAt === "string" ? achievement.earnedAt : null
    }));
}

function normalizeState(value) {
  const defaultState = createDefaultState();

  if (!isObject(value) || value.version !== CURRENT_VERSION) {
    return { state: defaultState, discardedAssessment: false };
  }

  const assessment = normalizeAssessment(value.assessment);
  const discardedAssessment = Boolean(value.assessment && !assessment);

  return {
    state: {
      ...defaultState,
      ...value,
      assessment,
      progress: normalizeProgress(value.progress),
      achievements: normalizeAchievements(value.achievements)
    },
    discardedAssessment
  };
}

export function createLocalStorageAdapter(storage = globalThis.localStorage) {
  function load() {
    if (!storage) {
      return {
        state: createDefaultState(),
        recoverableError: "Browser storage is unavailable. Guest progress cannot be saved."
      };
    }

    const storedValue = storage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return { state: createDefaultState(), recoverableError: null };
    }

    try {
      const normalized = normalizeState(JSON.parse(storedValue));
      return {
        state: normalized.state,
        recoverableError: normalized.discardedAssessment
          ? "Saved assessment data uses an older or incompatible format. Please retake the assessment."
          : null
      };
    } catch (error) {
      return {
        state: createDefaultState(),
        recoverableError: "Saved guest data could not be read. A clean guest state was loaded."
      };
    }
  }

  function save(state) {
    if (!storage) {
      return {
        state,
        recoverableError: "Browser storage is unavailable. Guest progress cannot be saved."
      };
    }

    const nextState = {
      ...normalizeState(state).state,
      updatedAt: new Date().toISOString()
    };

    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      return { state: nextState, recoverableError: null };
    } catch (error) {
      return {
        state: nextState,
        recoverableError: "Guest data could not be saved in this browser."
      };
    }
  }

  function update(updater) {
    const current = load();
    const nextState = updater(current.state);
    const saved = save(nextState);

    return {
      state: saved.state,
      recoverableError: current.recoverableError || saved.recoverableError
    };
  }

  function reset() {
    if (storage) {
      storage.removeItem(STORAGE_KEY);
    }

    return { state: createDefaultState(), recoverableError: null };
  }

  function exportJson() {
    return JSON.stringify(load().state, null, 2);
  }

  return {
    load,
    save,
    update,
    reset,
    exportJson
  };
}
