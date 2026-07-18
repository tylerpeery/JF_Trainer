import { createLocalStorageAdapter } from "./local-storage.js";

export function createStorageManager(adapter = createLocalStorageAdapter()) {
  let lastLoad = adapter.load();

  function getSnapshot() {
    lastLoad = adapter.load();
    return lastLoad;
  }

  function setActiveView(viewId) {
    lastLoad = adapter.update((state) => ({
      ...state,
      activeView: viewId
    }));

    return lastLoad;
  }

  function startGuestSession() {
    lastLoad = adapter.update((state) => ({
      ...state,
      mode: "guest",
      guestStartedAt: state.guestStartedAt || new Date().toISOString(),
      activeView: "assessment"
    }));

    return lastLoad;
  }

  function saveAssessmentResult(assessmentResult) {
    lastLoad = adapter.update((state) => ({
      ...state,
      assessment: {
        ...assessmentResult,
        accuracyFeedback: null
      },
      activeView: "assessment"
    }));

    return lastLoad;
  }

  function saveAssessmentAccuracyFeedback(feedbackId) {
    lastLoad = adapter.update((state) => ({
      ...state,
      assessment: state.assessment
        ? {
            ...state.assessment,
            accuracyFeedback: {
              value: feedbackId,
              updatedAt: new Date().toISOString()
            }
          }
        : null
    }));

    return lastLoad;
  }

  return {
    getSnapshot,
    setActiveView,
    startGuestSession,
    saveAssessmentResult,
    saveAssessmentAccuracyFeedback
  };
}
