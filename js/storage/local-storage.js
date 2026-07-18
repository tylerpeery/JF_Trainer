const STORAGE_KEY = "ai-training-pathfinder:guest-state:v1";
const CURRENT_VERSION = 1;

function createDefaultState() {
  return {
    version: CURRENT_VERSION,
    mode: "guest",
    activeView: "home",
    guestStartedAt: null,
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

function normalizeState(value) {
  const defaultState = createDefaultState();

  if (!isObject(value) || value.version !== CURRENT_VERSION) {
    return defaultState;
  }

  return {
    ...defaultState,
    ...value,
    progress: {
      ...defaultState.progress,
      ...(isObject(value.progress) ? value.progress : {})
    },
    achievements: Array.isArray(value.achievements) ? value.achievements : []
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
      return { state: normalizeState(JSON.parse(storedValue)), recoverableError: null };
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
      ...normalizeState(state),
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
