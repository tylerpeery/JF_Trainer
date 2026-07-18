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
      progress: {
        ...defaultState.progress,
        ...(isObject(value.progress) ? value.progress : {})
      },
      achievements: Array.isArray(value.achievements) ? value.achievements : []
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
