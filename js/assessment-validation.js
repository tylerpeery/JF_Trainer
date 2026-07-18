function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function optionValue(option) {
  return typeof option === "string" ? option : option.id;
}

function optionLabel(option) {
  return typeof option === "string" ? option : option.label;
}

function uniqueValues(values) {
  return [...new Set(asArray(values))];
}

function createOptionSet(options) {
  return new Set(options.map(optionValue));
}

function selectedUnknownValues(values, allowedValues) {
  return uniqueValues(values).filter((value) => !allowedValues.has(value));
}

function validateUniqueArray(errors, values, label) {
  if (asArray(values).length !== uniqueValues(values).length) {
    errors.push(`${label} include duplicate selections.`);
  }
}

function findQuestion(assessmentConfig, questionId) {
  return assessmentConfig.questions.find((question) => question.id === questionId);
}

function validateSingleQuestion(errors, answers, question) {
  const value = answers[question.id];
  const allowedValues = createOptionSet(question.options);

  if (question.required && !value) {
    errors.push(`Answer "${question.title}".`);
    return;
  }

  if (value && !allowedValues.has(value)) {
    errors.push(`"${optionLabel({ label: value })}" is not a valid answer for "${question.title}".`);
  }
}

function validateMultipleQuestion(errors, answers, question) {
  const values = asArray(answers[question.id]);
  const allowedValues = createOptionSet(question.options);

  if (question.required && values.length === 0) {
    errors.push(`Choose at least one option for "${question.title}".`);
  }

  validateUniqueArray(errors, values, `"${question.title}"`);

  selectedUnknownValues(values, allowedValues).forEach((value) => {
    errors.push(`"${value}" is not a valid option for "${question.title}".`);
  });

  if (
    question.mutuallyExclusiveOptionId &&
    values.includes(question.mutuallyExclusiveOptionId) &&
    values.length > 1
  ) {
    errors.push(`"${question.mutuallyExclusiveOptionId}" cannot be combined with other options for "${question.title}".`);
  }
}

export function validateAssessmentAnswers(answers, appConfig, assessmentConfig) {
  const errors = [];
  const primaryField = answers.primaryField || "";
  const secondaryFields = asArray(answers.secondaryFields);
  const workPatterns = asArray(answers.workPatterns);
  const learningGoals = asArray(answers.learningGoals);
  const preferredFormats = asArray(answers.preferredFormats);
  const fieldOptions = new Set(appConfig.professionalFields);
  const workPatternOptions = createOptionSet(appConfig.workPatterns);
  const learningGoalOptions = createOptionSet(assessmentConfig.learningGoals);
  const weeklyTimeOptions = createOptionSet(assessmentConfig.weeklyTimeOptions);
  const preferredFormatOptions = createOptionSet(assessmentConfig.preferredFormats);
  const secondaryMaximum = appConfig.selectionRules.secondaryFieldsMaximum;
  const workPatternMinimum = appConfig.selectionRules.workPatternsMinimum || 1;
  const workPatternMaximum = appConfig.selectionRules.workPatternsMaximum;
  const learningGoalMinimum = appConfig.selectionRules.learningGoalsMinimum || 1;
  const learningGoalMaximum = appConfig.selectionRules.learningGoalsMaximum || 3;

  if (!primaryField) {
    errors.push("Choose exactly one primary professional field.");
  } else if (!fieldOptions.has(primaryField)) {
    errors.push(`"${primaryField}" is not a valid primary professional field.`);
  }

  validateUniqueArray(errors, secondaryFields, "Secondary fields");

  if (secondaryFields.length > secondaryMaximum) {
    errors.push(`Choose no more than ${secondaryMaximum} secondary fields.`);
  }

  if (secondaryFields.includes(primaryField)) {
    errors.push("Primary professional field cannot also be selected as a secondary field.");
  }

  selectedUnknownValues(secondaryFields, fieldOptions).forEach((value) => {
    errors.push(`"${value}" is not a valid secondary professional field.`);
  });

  validateUniqueArray(errors, workPatterns, "Work patterns");

  if (workPatterns.length < workPatternMinimum) {
    errors.push("Choose at least one work pattern.");
  }

  if (workPatterns.length > workPatternMaximum) {
    errors.push(`Choose no more than ${workPatternMaximum} work patterns.`);
  }

  selectedUnknownValues(workPatterns, workPatternOptions).forEach((value) => {
    errors.push(`"${value}" is not a valid work pattern.`);
  });

  assessmentConfig.questions.forEach((question) => {
    if (question.type === "multiple") {
      validateMultipleQuestion(errors, answers, question);
    } else {
      validateSingleQuestion(errors, answers, question);
    }
  });

  const responsibilityQuestion = findQuestion(assessmentConfig, "aiResponsibility");
  if (responsibilityQuestion && !answers.aiResponsibility) {
    errors.push("Choose the best description of your responsibility for AI-assisted work.");
  }

  validateUniqueArray(errors, learningGoals, "Learning goals");

  if (learningGoals.length < learningGoalMinimum) {
    errors.push("Choose at least one learning goal.");
  }

  if (learningGoals.length > learningGoalMaximum) {
    errors.push(`Choose no more than ${learningGoalMaximum} learning goals.`);
  }

  selectedUnknownValues(learningGoals, learningGoalOptions).forEach((value) => {
    errors.push(`"${value}" is not a valid learning goal.`);
  });

  if (!answers.weeklyTime) {
    errors.push("Choose your available weekly learning time.");
  } else if (!weeklyTimeOptions.has(answers.weeklyTime)) {
    errors.push(`"${answers.weeklyTime}" is not a valid weekly learning time.`);
  }

  validateUniqueArray(errors, preferredFormats, "Preferred formats");

  if (preferredFormats.length === 0) {
    errors.push("Choose at least one preferred format or No preference.");
  }

  selectedUnknownValues(preferredFormats, preferredFormatOptions).forEach((value) => {
    errors.push(`"${value}" is not a valid preferred format.`);
  });

  if (preferredFormats.includes("no-preference") && preferredFormats.length > 1) {
    errors.push("No preference cannot be combined with other preferred formats.");
  }

  return errors;
}
