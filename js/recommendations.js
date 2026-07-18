function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function intersects(left, right) {
  const rightSet = new Set(asArray(right));
  return asArray(left).filter((value) => rightSet.has(value));
}

function includesAllFields(fields) {
  return asArray(fields).includes("All fields");
}

function weeklyBudgetMinutes(assessment, recommendationConfig) {
  const weeklyTime = assessment?.selections?.weeklyTime;
  return recommendationConfig.weeklyTimeMinutes?.[weeklyTime] || null;
}

function itemType(item) {
  return item.provider === "AI Training Pathfinder" ? "practice" : "resource";
}

function scoreItem(item, assessment, recommendationConfig, selectedProviders) {
  const weights = recommendationConfig.weights;
  const reasons = [];
  const selections = assessment.selections || {};
  const answers = assessment.answers || {};
  const primaryField = selections.primaryField;
  const secondaryFields = asArray(selections.secondaryFields);
  const workPatterns = asArray(selections.workPatterns);
  const learningGoals = asArray(selections.learningGoals);
  const preferredFormats = asArray(selections.preferredFormats);
  const responsibility = selections.responsibility || answers.aiResponsibility;
  const practicalLevel = assessment.practicalFluency?.level?.id;
  const technicalLevel = assessment.technicalOrientation?.level?.id;
  const budgetMinutes = weeklyBudgetMinutes(assessment, recommendationConfig);
  let score = weights.stageBase || 0;

  if (item.professionalFields?.includes(primaryField)) {
    score += weights.primaryField;
    reasons.push("Selected because it matches your primary professional field.");
  } else if (includesAllFields(item.professionalFields)) {
    score += weights.allFields;
    reasons.push("Selected because it is broadly useful across professional fields.");
  }

  if (intersects(item.professionalFields, secondaryFields).length > 0) {
    score += weights.secondaryField;
    reasons.push("Selected because it also matches one of your secondary fields.");
  }

  const matchingPatterns = intersects(item.workPatterns, workPatterns);
  if (matchingPatterns.length > 0) {
    score += weights.workPattern * matchingPatterns.length;
    reasons.push("Selected because it supports your work patterns.");
  }

  if (item.practicalFluencyLevels?.includes(practicalLevel)) {
    score += weights.practicalFluency;
    reasons.push("Appropriate for your current practical AI fluency.");
  }

  if (item.technicalOrientations?.includes(technicalLevel)) {
    score += weights.technicalOrientation;
    reasons.push("Appropriate for your technical orientation.");
  }

  const matchingGoals = intersects(item.learningGoals, learningGoals);
  if (matchingGoals.length > 0) {
    score += weights.learningGoal * matchingGoals.length;
    reasons.push("Selected because it matches your learning goals.");
  }

  if (responsibility && item.responsibilityIds?.includes(responsibility)) {
    score += weights.responsibility;
    reasons.push("Selected because it fits your review, leadership, governance, or system responsibilities.");
  }

  if (preferredFormats.includes("no-preference") || preferredFormats.includes(item.formatId)) {
    score += weights.format;
    reasons.push("Selected because it fits your preferred format.");
  }

  if (budgetMinutes && typeof item.estimatedMinutes === "number" && item.estimatedMinutes <= budgetMinutes) {
    score += weights.timeFit;
    reasons.push("Fits within your normal weekly learning time.");
  }

  if (selectedProviders.has(item.provider)) {
    score -= recommendationConfig.providerDiversity.repeatProviderPenalty || 0;
  }

  return {
    item,
    score,
    reasons: reasons.slice(0, recommendationConfig.explanationLimits.maximumReasonsPerItem)
  };
}

function compareRecommendations(left, right) {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  if (left.item.provider !== right.item.provider) {
    return left.item.provider.localeCompare(right.item.provider);
  }

  return left.item.title.localeCompare(right.item.title);
}

function activeItemsForStage(catalog, practiceCards, stage) {
  return [...asArray(catalog), ...asArray(practiceCards)].filter((item) => {
    return item.active && item.pathStage === stage;
  });
}

function selectStageItems(items, assessment, recommendationConfig, selectedProviders) {
  const minimumScore = recommendationConfig.thresholds.minimumRecommendedScore;
  const scored = items
    .map((item) => scoreItem(item, assessment, recommendationConfig, selectedProviders))
    .filter((recommendation) => recommendation.score >= minimumScore)
    .sort(compareRecommendations);

  if (scored.length === 0 && items.length > 0) {
    return [scoreItem(items[0], assessment, recommendationConfig, selectedProviders)];
  }

  return scored;
}

export function buildLearningPath(assessment, catalog, practiceCards, recommendationConfig) {
  if (!assessment) {
    return null;
  }

  const selectedProviders = new Set();
  const stages = recommendationConfig.stageOrder.map((stageName) => {
    const stageItems = activeItemsForStage(catalog, practiceCards, stageName);
    const limit = recommendationConfig.stageItemLimits[stageName] || 1;
    const recommendations = selectStageItems(
      stageItems,
      assessment,
      recommendationConfig,
      selectedProviders
    ).slice(0, limit);

    recommendations.forEach((recommendation) => {
      selectedProviders.add(recommendation.item.provider);
    });

    return {
      stage: stageName,
      items: recommendations.map((recommendation) => ({
        id: recommendation.item.id,
        type: itemType(recommendation.item),
        title: recommendation.item.title,
        provider: recommendation.item.provider,
        description: recommendation.item.description,
        url: recommendation.item.url || null,
        estimatedMinutes: recommendation.item.estimatedMinutes,
        durationNote: recommendation.item.durationNote || "",
        format: recommendation.item.format,
        score: Number(recommendation.score.toFixed(2)),
        reasons: recommendation.reasons,
        evidenceNote: recommendation.item.evidenceNote || "",
        safetyReminder: recommendation.item.safetyReminder || "",
        deliverable: recommendation.item.deliverable || ""
      }))
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    assessmentVersion: assessment.assessmentVersion,
    stages
  };
}
