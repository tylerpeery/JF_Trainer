const LEVEL_ORDER = [
  "new-to-ai",
  "foundational-user",
  "applied-user",
  "advanced-practitioner",
  "general-user",
  "productivity-low-code",
  "developer-data-practitioner",
  "ai-ml-builder"
];

function getLevel(score, thresholds) {
  const match = thresholds.find((threshold) => score <= threshold.maxScore);
  return match?.levelId || thresholds[thresholds.length - 1].levelId;
}

function findLevel(levels, levelId) {
  return levels.find((level) => level.id === levelId) || { id: levelId, label: levelId };
}

function levelIndex(levelId) {
  return LEVEL_ORDER.indexOf(levelId);
}

function capLevel(levelId, maxLevelId) {
  if (levelIndex(levelId) === -1 || levelIndex(maxLevelId) === -1) {
    return levelId;
  }

  return levelIndex(levelId) > levelIndex(maxLevelId) ? maxLevelId : levelId;
}

function selectedOptionsForQuestion(question, answer) {
  if (question.type === "multiple") {
    const selectedIds = Array.isArray(answer) ? answer : [];
    return question.options.filter((option) => selectedIds.includes(option.id));
  }

  return question.options.filter((option) => option.id === answer);
}

function createSignalState() {
  return {
    scores: {
      useFrequency: 0,
      demonstratedPracticalExperience: 0,
      promptWorkflowSkill: 0,
      verificationBehavior: 0,
      responsibleUseJudgment: 0,
      limitationsUnderstanding: 0,
      technicalExperience: 0,
      technicalActivity: 0,
      responsibilityAuthority: 0
    },
    flags: {
      noIndependentActivities: false,
      independentPracticalUse: false,
      promptRevision: false,
      verificationPractice: false,
      repeatableWorkflow: false,
      lowCodeEvidence: false,
      developerDataEvidence: false,
      aiMlBuilderEvidence: false,
      technicalResponsibility: false
    }
  };
}

function collectSignals(answers, questions) {
  const signals = createSignalState();

  questions.forEach((question) => {
    selectedOptionsForQuestion(question, answers[question.id]).forEach((option) => {
      Object.entries(option.scoringSignals || {}).forEach(([key, score]) => {
        if (typeof score === "number") {
          signals.scores[key] = Math.max(signals.scores[key] || 0, score);
        }
      });

      (option.evidenceFlags || []).forEach((flag) => {
        signals.flags[flag] = true;
      });
    });
  });

  return signals;
}

function weightedScore(scores, weights) {
  const entries = Object.entries(weights);
  const weightTotal = entries.reduce((total, [, weight]) => total + weight, 0);

  if (weightTotal === 0) {
    return 0;
  }

  const rawScore = entries.reduce((total, [key, weight]) => {
    return total + (scores[key] || 0) * weight;
  }, 0);

  return rawScore / weightTotal;
}

function hasMinimumSignals(scores, minimumSignals) {
  return Object.entries(minimumSignals || {}).every(([key, minimum]) => {
    return (scores[key] || 0) >= minimum;
  });
}

function applyPracticalGates(levelId, signals, scoringConfig) {
  const gates = scoringConfig.gates || {};
  const gateMessages = [];
  let gatedLevelId = levelId;

  if (signals.flags.noIndependentActivities) {
    gatedLevelId = capLevel(gatedLevelId, gates.noIndependentActivitiesMaxLevel);
    gateMessages.push("No independent AI activities were reported, so practical fluency cannot exceed Foundational user.");
  }

  if (
    gates.appliedRequiresFlag &&
    !signals.flags[gates.appliedRequiresFlag] &&
    levelIndex(gatedLevelId) >= levelIndex("applied-user")
  ) {
    gatedLevelId = "foundational-user";
    gateMessages.push("Applied user requires evidence of independent practical use.");
  }

  const advancedRequested = levelIndex(gatedLevelId) >= levelIndex("advanced-practitioner");
  const hasAdvancedFlags = (gates.advancedRequiresFlags || []).every((flag) => signals.flags[flag]);
  const hasAdvancedSignals = hasMinimumSignals(signals.scores, gates.advancedMinimumSignals);

  if (advancedRequested && (!hasAdvancedFlags || !hasAdvancedSignals)) {
    gatedLevelId = gates.advancedFallbackLevel || "applied-user";
    gateMessages.push("Advanced practitioner requires repeatable workflow experience plus strong verification and responsible-use evidence.");
  }

  return { levelId: gatedLevelId, gateMessages };
}

function applyTechnicalGates(levelId, signals, scoringConfig) {
  const gates = scoringConfig.gates || {};
  const gateMessages = [];
  let gatedLevelId = levelId;

  if (
    levelIndex(gatedLevelId) >= levelIndex("developer-data-practitioner") &&
    gates.developerRequiresFlag &&
    !signals.flags[gates.developerRequiresFlag]
  ) {
    gatedLevelId = gates.developerFallbackLevel || "productivity-low-code";
    gateMessages.push("Developer or data practitioner requires explicit code, data, scripting, API, or comparable technical evidence.");
  }

  if (
    levelIndex(gatedLevelId) >= levelIndex("ai-ml-builder") &&
    gates.aiMlRequiresFlag &&
    !signals.flags[gates.aiMlRequiresFlag]
  ) {
    gatedLevelId = gates.aiMlFallbackLevel || "developer-data-practitioner";
    gateMessages.push("AI/ML builder requires explicit AI or machine-learning system building, deployment, or technical evaluation evidence.");
  }

  return { levelId: gatedLevelId, gateMessages };
}

function buildPracticalEvidence(signals, gateMessages) {
  const evidence = [];

  if (signals.flags.noIndependentActivities) {
    evidence.push("You have not yet reported independent AI activities.");
  } else if (signals.flags.repeatableWorkflow) {
    evidence.push("You reported using AI in a repeatable workflow or breaking tasks into tested steps.");
  } else if (signals.flags.promptRevision) {
    evidence.push("You have independently refined prompts by adding context, examples, or structure.");
  } else if (signals.flags.independentPracticalUse) {
    evidence.push("You reported at least one independent AI activity.");
  }

  if (signals.scores.verificationBehavior >= 3) {
    evidence.push("Your verification approach includes sources, uncertainty, consequences, and human judgment.");
  } else if (signals.scores.verificationBehavior >= 2) {
    evidence.push("You verify important AI output against authoritative sources.");
  } else {
    evidence.push("Your responses show room to strengthen verification before relying on important AI output.");
  }

  if (signals.scores.responsibleUseJudgment >= 3) {
    evidence.push("Your information-handling approach considers tool approval, sensitivity, minimization, retention, access, downstream use, and human review.");
  } else if (signals.scores.responsibleUseJudgment >= 2) {
    evidence.push("You consider tool approval and data minimization before entering work information.");
  } else {
    evidence.push("Responsible information-handling practices should be strengthened before using AI with work-related content.");
  }

  if (signals.scores.useFrequency >= 2.4 && signals.scores.verificationBehavior < 2) {
    evidence.push("Frequent use did not raise the result by itself because verification practices were limited.");
  }

  return [...evidence, ...gateMessages];
}

function buildTechnicalEvidence(signals, gateMessages) {
  const evidence = [];

  if (signals.flags.aiMlBuilderEvidence) {
    evidence.push("You reported building, deploying, evaluating, or otherwise working directly with AI or machine-learning systems.");
  } else if (signals.flags.developerDataEvidence) {
    evidence.push("You reported experience using code, scripts, data tools, APIs, or automation.");
  } else if (signals.flags.lowCodeEvidence) {
    evidence.push("Your technical experience centers on spreadsheets, formulas, low-code tools, or productivity automation.");
  } else {
    evidence.push("Your technical experience appears centered on ordinary workplace software.");
  }

  if (signals.scores.responsibilityAuthority >= 2 && !signals.flags.developerDataEvidence) {
    evidence.push("Review, supervision, and governance responsibilities are preserved for future routing but do not raise technical orientation by themselves.");
  }

  return [...evidence, ...gateMessages];
}

export function calculateProfile(answers, assessmentConfig, appConfig) {
  const signals = collectSignals(answers, assessmentConfig.questions);
  const practicalScore = weightedScore(
    signals.scores,
    assessmentConfig.scoring.practicalFluency.weights
  );
  const technicalScore = weightedScore(
    signals.scores,
    assessmentConfig.scoring.technicalOrientation.weights
  );
  const initialPracticalLevelId = getLevel(
    practicalScore,
    assessmentConfig.profileThresholds.practicalFluency
  );
  const initialTechnicalLevelId = getLevel(
    technicalScore,
    assessmentConfig.profileThresholds.technicalOrientation
  );
  const practicalGateResult = applyPracticalGates(
    initialPracticalLevelId,
    signals,
    assessmentConfig.scoring.practicalFluency
  );
  const technicalGateResult = applyTechnicalGates(
    initialTechnicalLevelId,
    signals,
    assessmentConfig.scoring.technicalOrientation
  );

  return {
    assessmentVersion: assessmentConfig.assessmentVersion,
    completedAt: new Date().toISOString(),
    practicalFluency: {
      score: Number(practicalScore.toFixed(2)),
      level: findLevel(appConfig.practicalFluencyLevels, practicalGateResult.levelId),
      evidence: buildPracticalEvidence(signals, practicalGateResult.gateMessages)
    },
    technicalOrientation: {
      score: Number(technicalScore.toFixed(2)),
      level: findLevel(appConfig.technicalOrientationLevels, technicalGateResult.levelId),
      evidence: buildTechnicalEvidence(signals, technicalGateResult.gateMessages)
    },
    scoringSignals: {
      scores: signals.scores,
      flags: signals.flags
    },
    selections: {
      primaryField: answers.primaryField,
      secondaryFields: answers.secondaryFields || [],
      workPatterns: answers.workPatterns || [],
      learningGoals: answers.learningGoals || [],
      weeklyTime: answers.weeklyTime,
      preferredFormats: answers.preferredFormats || [],
      responsibility: answers.aiResponsibility
    },
    answers
  };
}
