import { createLocalStorageAdapter } from "./local-storage.js";
import {
  buildProgressSummary,
  createTrackableItem,
  mergeEarnedAchievements,
  normalizeCompletionInput
} from "../progress.js";

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

  function awardCurrentAchievements(state, milestones = [], achievementDefinitions = []) {
    const summary = buildProgressSummary(state, milestones, achievementDefinitions);

    return {
      ...state,
      achievements: mergeEarnedAchievements(state.achievements, summary)
    };
  }

  function refreshAchievements(milestones = [], achievementDefinitions = []) {
    lastLoad = adapter.update((state) => awardCurrentAchievements(state, milestones, achievementDefinitions));
    return lastLoad;
  }

  function startResource(item, type = "resource") {
    const trackableItem = createTrackableItem(item, type);

    lastLoad = adapter.update((state) => ({
      ...state,
      progress: {
        ...state.progress,
        resourceStates: {
          ...state.progress.resourceStates,
          [trackableItem.id]: {
            ...trackableItem,
            ...(state.progress.resourceStates[trackableItem.id] || {}),
            ...trackableItem,
            status: state.progress.resourceStates[trackableItem.id]?.status || "started",
            startedAt: state.progress.resourceStates[trackableItem.id]?.startedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
      }
    }));

    return lastLoad;
  }

  function completeResource(item, type = "resource", completionInput = {}, milestones = [], achievementDefinitions = []) {
    const trackableItem = createTrackableItem(item, type);
    const completion = normalizeCompletionInput(completionInput);

    lastLoad = adapter.update((state) => {
      const existing = state.progress.resourceStates[trackableItem.id] || {};
      const nextState = {
        ...state,
        progress: {
          ...state.progress,
          resourceStates: {
            ...state.progress.resourceStates,
            [trackableItem.id]: {
              ...existing,
              ...trackableItem,
              ...completion,
              status: "completed",
              startedAt: existing.startedAt || new Date().toISOString(),
              completedAt: existing.completedAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }
        }
      };

      return awardCurrentAchievements(nextState, milestones, achievementDefinitions);
    });

    return lastLoad;
  }

  function undoResourceCompletion(resourceId, milestones = [], achievementDefinitions = []) {
    lastLoad = adapter.update((state) => {
      const existing = state.progress.resourceStates[resourceId];

      if (!existing) {
        return state;
      }

      const nextState = {
        ...state,
        progress: {
          ...state.progress,
          resourceStates: {
            ...state.progress.resourceStates,
            [resourceId]: {
              ...existing,
              status: "started",
              completedAt: null,
              completionDate: "",
              updatedAt: new Date().toISOString()
            }
          }
        }
      };

      return awardCurrentAchievements(nextState, milestones, achievementDefinitions);
    });

    return lastLoad;
  }

  function saveResourceFeedback(resourceId, feedbackInput = {}) {
    const feedback = normalizeCompletionInput(feedbackInput);

    lastLoad = adapter.update((state) => {
      const existing = state.progress.resourceStates[resourceId];

      if (!existing) {
        return state;
      }

      return {
        ...state,
        progress: {
          ...state.progress,
          resourceStates: {
            ...state.progress.resourceStates,
            [resourceId]: {
              ...existing,
              ...feedback,
              updatedAt: new Date().toISOString()
            }
          }
        }
      };
    });

    return lastLoad;
  }

  function saveMilestoneReflection(milestoneId, reflection = {}) {
    lastLoad = adapter.update((state) => ({
      ...state,
      progress: {
        ...state.progress,
        milestoneReflections: {
          ...(state.progress.milestoneReflections || {}),
          [milestoneId]: {
            usingAiMore: typeof reflection.usingAiMore === "string" ? reflection.usingAiMore : "",
            evaluatingOutputConfidence: typeof reflection.evaluatingOutputConfidence === "string"
              ? reflection.evaluatingOutputConfidence
              : "",
            nonsensitiveExample: typeof reflection.nonsensitiveExample === "string"
              ? reflection.nonsensitiveExample.trim().slice(0, 500)
              : "",
            updatedAt: new Date().toISOString()
          }
        }
      }
    }));

    return lastLoad;
  }

  function resetGuestData() {
    lastLoad = adapter.reset();
    return lastLoad;
  }

  function exportGuestData() {
    return adapter.exportJson();
  }

  return {
    getSnapshot,
    setActiveView,
    startGuestSession,
    saveAssessmentResult,
    saveAssessmentAccuracyFeedback,
    refreshAchievements,
    startResource,
    completeResource,
    undoResourceCompletion,
    saveResourceFeedback,
    saveMilestoneReflection,
    resetGuestData,
    exportGuestData
  };
}
