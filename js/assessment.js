function getLevel(score, thresholds) {
  const match = thresholds.find((threshold) => score <= threshold.maxScore);
  return match?.levelId || thresholds[thresholds.length - 1].levelId;
}

function selectedOptionsForQuestion(question, answer) {
  if (question.type === "multiple") {
    const selectedIds = Array.isArray(answer) ? answer : [];
    return question.options.filter((option) => selectedIds.includes(option.id));
  }

  return question.options.filter((option) => option.id === answer);
}

function scoreAnswers(answers, questions) {
  const scores = {
    practicalFluency: [],
    technicalOrientation: []
  };

  questions.forEach((question) => {
    const selectedOptions = selectedOptionsForQuestion(question, answers[question.id]);

    if (selectedOptions.length === 0) {
      return;
    }

    const fluencyScores = selectedOptions
      .map((option) => option.fluencyScore)
      .filter((score) => typeof score === "number");
    const technicalScores = selectedOptions
      .map((option) => option.technicalScore)
      .filter((score) => typeof score === "number");

    if (fluencyScores.length > 0) {
      scores.practicalFluency.push(Math.max(...fluencyScores));
    }

    if (technicalScores.length > 0) {
      scores.technicalOrientation.push(Math.max(...technicalScores));
    }
  });

  return scores;
}

function average(scores) {
  if (scores.length === 0) {
    return 0;
  }

  return scores.reduce((total, score) => total + score, 0) / scores.length;
}

function averageTopScores(scores, count) {
  if (scores.length === 0) {
    return 0;
  }

  const topScores = [...scores].sort((left, right) => right - left).slice(0, count);
  return average(topScores);
}

function findLevel(levels, levelId) {
  return levels.find((level) => level.id === levelId) || { id: levelId, label: levelId };
}

export function calculateProfile(answers, assessmentConfig, appConfig) {
  const scores = scoreAnswers(answers, assessmentConfig.questions);
  const fluencyScore = average(scores.practicalFluency);
  const technicalScore = averageTopScores(scores.technicalOrientation, 3);
  const fluencyLevelId = getLevel(fluencyScore, assessmentConfig.profileThresholds.practicalFluency);
  const technicalLevelId = getLevel(
    technicalScore,
    assessmentConfig.profileThresholds.technicalOrientation
  );

  return {
    assessmentVersion: assessmentConfig.assessmentVersion,
    completedAt: new Date().toISOString(),
    practicalFluency: {
      score: Number(fluencyScore.toFixed(2)),
      level: findLevel(appConfig.practicalFluencyLevels, fluencyLevelId)
    },
    technicalOrientation: {
      score: Number(technicalScore.toFixed(2)),
      level: findLevel(appConfig.technicalOrientationLevels, technicalLevelId)
    },
    selections: {
      primaryField: answers.primaryField,
      secondaryFields: answers.secondaryFields || [],
      workPatterns: answers.workPatterns || [],
      learningGoals: answers.learningGoals || [],
      weeklyTime: answers.weeklyTime,
      preferredFormats: answers.preferredFormats || []
    },
    answers
  };
}
