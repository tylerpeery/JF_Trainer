import { loadCatalog } from "./catalog.js";
import { loadConfiguration } from "./configuration.js";
import { calculateProfile } from "./assessment.js";
import { validateAssessmentAnswers } from "./assessment-validation.js";
import { buildLearningPath } from "./recommendations.js";
import { createStorageManager } from "./storage/storage-manager.js";

const panels = Array.from(document.querySelectorAll("[data-view-panel]"));
const navButtons = Array.from(document.querySelectorAll(".nav-link"));
const statusPanel = document.querySelector(".status-panel");
const statusText = document.querySelector("#app-status");
const mainContent = document.querySelector("#main-content");
const storageManager = createStorageManager();
const appData = {
  appConfig: null,
  assessmentConfig: null,
  recommendationConfig: null,
  catalog: [],
  practiceCards: []
};

function setStatus(message, isError = false) {
  if (!statusPanel || !statusText) {
    return;
  }

  statusText.textContent = message || "";
  statusPanel.hidden = !message;
  statusPanel.dataset.error = isError ? "true" : "false";
}

function setView(viewId, options = {}) {
  const targetPanel = panels.find((panel) => panel.dataset.viewPanel === viewId);

  if (!targetPanel) {
    setStatus("That view is not available yet.", true);
    return;
  }

  panels.forEach((panel) => {
    panel.hidden = panel !== targetPanel;
  });

  navButtons.forEach((button) => {
    const isCurrent = button.dataset.view === viewId;
    button.setAttribute("aria-current", isCurrent ? "page" : "false");
  });

  storageManager.setActiveView(viewId);

  if (options.focusMain) {
    mainContent.focus({ preventScroll: true });
  }
}

function createCard(title, body, items = []) {
  const card = document.createElement("article");
  card.className = "summary-card";

  const heading = document.createElement("h3");
  heading.textContent = title;
  card.append(heading);

  const paragraph = document.createElement("p");
  paragraph.textContent = body;
  card.append(paragraph);

  if (items.length > 0) {
    const tagList = document.createElement("div");
    tagList.className = "tag-list";

    items.forEach((item) => {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = item;
      tagList.append(tag);
    });

    card.append(tagList);
  }

  return card;
}

function formatDuration(minutes, note = "") {
  if (typeof minutes !== "number") {
    return note || "Duration not stated";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

function createOptionInput({ type, name, value, label, description = "", checked = false }) {
  const optionId = `${name}-${String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const wrapper = document.createElement("label");
  wrapper.className = "option-row";
  wrapper.setAttribute("for", optionId);

  const input = document.createElement("input");
  input.type = type;
  input.name = name;
  input.id = optionId;
  input.value = value;
  input.checked = checked;

  const text = document.createElement("span");
  text.className = "option-text";

  const labelText = document.createElement("span");
  labelText.textContent = label;
  text.append(labelText);

  if (description) {
    const descriptionText = document.createElement("small");
    descriptionText.textContent = description;
    text.append(descriptionText);
  }

  wrapper.append(input, text);
  return wrapper;
}

function createFieldset(title, description = "") {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "assessment-section";

  const legend = document.createElement("legend");
  legend.textContent = title;
  fieldset.append(legend);

  if (description) {
    const helper = document.createElement("p");
    helper.className = "selection-note";
    helper.textContent = description;
    fieldset.append(helper);
  }

  return fieldset;
}

function createCheckboxGroup({ title, description, name, options, required = false, max = null }) {
  const fieldset = createFieldset(title, description);
  const optionStack = document.createElement("div");
  optionStack.className = "option-stack";
  optionStack.dataset.checkboxGroup = name;

  options.forEach((option) => {
    const label = typeof option === "string" ? option : option.label;
    const value = typeof option === "string" ? option : option.id;
    const optionDescription = typeof option === "string" ? "" : option.description || "";
    optionStack.append(
      createOptionInput({
        type: "checkbox",
        name,
        value,
        label,
        description: optionDescription
      })
    );
  });

  const note = document.createElement("p");
  note.className = "selection-note";
  note.id = `${name}-note`;
  note.textContent = max ? `Select up to ${max}.` : "Select all that apply.";

  fieldset.dataset.requiredGroup = required ? name : "";
  fieldset.dataset.maxSelections = max || "";
  fieldset.append(optionStack, note);
  return fieldset;
}

function createCompactChoiceGroup({ title, description = "", name, options, type = "checkbox", max = null }) {
  const wrapper = document.createElement("div");
  wrapper.className = "choice-subsection";

  const heading = document.createElement("h3");
  heading.textContent = title;
  wrapper.append(heading);

  if (description) {
    const helper = document.createElement("p");
    helper.className = "selection-note";
    helper.textContent = description;
    wrapper.append(helper);
  }

  const optionStack = document.createElement("div");
  optionStack.className = "option-stack";

  options.forEach((option) => {
    const label = typeof option === "string" ? option : option.label;
    const value = typeof option === "string" ? option : option.id;
    const optionDescription = typeof option === "string" ? "" : option.description || "";
    optionStack.append(createOptionInput({ type, name, value, label, description: optionDescription }));
  });

  wrapper.append(optionStack);

  if (max) {
    const note = document.createElement("p");
    note.className = "selection-note";
    note.textContent = `Select up to ${max}.`;
    wrapper.append(note);
  }

  return wrapper;
}

function createRadioGroup(question) {
  const fieldset = createFieldset(question.title);
  const optionStack = document.createElement("div");
  optionStack.className = "option-stack";

  question.options.forEach((option) => {
    optionStack.append(
      createOptionInput({
        type: "radio",
        name: question.id,
        value: option.id,
        label: option.label,
        description: option.description || ""
      })
    );
  });

  fieldset.dataset.requiredGroup = question.required ? question.id : "";
  if (question.reminder) {
    const reminder = document.createElement("p");
    reminder.className = "handling-reminder";
    reminder.textContent = question.reminder;
    fieldset.append(reminder);
  }

  fieldset.append(optionStack);
  return fieldset;
}

function selectedValues(form, name) {
  return Array.from(form.querySelectorAll(`[name="${name}"]:checked`)).map((input) => input.value);
}

function bindSelectionLimit(form, name, max) {
  const checkboxes = Array.from(form.querySelectorAll(`[name="${name}"]`));
  const update = () => {
    const selectedCount = checkboxes.filter((checkbox) => checkbox.checked).length;

    checkboxes.forEach((checkbox) => {
      checkbox.disabled = checkbox.dataset.lockedByPrimary === "true" || (!checkbox.checked && selectedCount >= max);
    });
  };

  checkboxes.forEach((checkbox) => checkbox.addEventListener("change", update));
  update();
}

function bindExclusiveOption(form, name, exclusiveValue) {
  const checkboxes = Array.from(form.querySelectorAll(`[name="${name}"]`));
  const exclusive = checkboxes.find((checkbox) => checkbox.value === exclusiveValue);

  if (!exclusive) {
    return;
  }

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      if (checkbox === exclusive && checkbox.checked) {
        checkboxes
          .filter((other) => other !== exclusive)
          .forEach((other) => {
            other.checked = false;
          });
      }

      if (checkbox !== exclusive && checkbox.checked) {
        exclusive.checked = false;
      }
    });
  });
}

function bindPrimarySecondaryExclusion(form, secondaryMaximum) {
  const primarySelect = form.elements.primaryField;
  const secondaryCheckboxes = Array.from(form.querySelectorAll('[name="secondaryFields"]'));

  const update = () => {
    const selectedCount = secondaryCheckboxes.filter((checkbox) => {
      return checkbox.checked && checkbox.value !== primarySelect.value;
    }).length;

    secondaryCheckboxes.forEach((checkbox) => {
      const duplicatesPrimary = checkbox.value === primarySelect.value;
      checkbox.checked = duplicatesPrimary ? false : checkbox.checked;
      checkbox.dataset.lockedByPrimary = duplicatesPrimary ? "true" : "false";
      checkbox.disabled = duplicatesPrimary || (!checkbox.checked && selectedCount >= secondaryMaximum);
    });
  };

  primarySelect.addEventListener("change", update);
  update();
}

function populateAssessmentForm(form, answers = {}) {
  Object.entries(answers).forEach(([name, value]) => {
    if (Array.isArray(value)) {
      form.querySelectorAll(`[name="${name}"]`).forEach((input) => {
        input.checked = value.includes(input.value);
      });
      return;
    }

    const field = form.elements[name];

    if (!field) {
      return;
    }

    if (field instanceof RadioNodeList) {
      field.value = value || "";
      return;
    }

    field.value = value || "";
  });

  form.querySelectorAll("input, select").forEach((input) => {
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

function readAssessmentAnswers(form) {
  return {
    primaryField: form.elements.primaryField.value,
    secondaryFields: selectedValues(form, "secondaryFields"),
    workPatterns: selectedValues(form, "workPatterns"),
    genAiFrequency: form.elements.genAiFrequency.value,
    independentExperience: selectedValues(form, "independentExperience"),
    verifyOutput: form.elements.verifyOutput.value,
    promptWorkflow: form.elements.promptWorkflow.value,
    responsibleHandling: form.elements.responsibleHandling.value,
    limitations: form.elements.limitations.value,
    technicalExperience: form.elements.technicalExperience.value,
    aiResponsibility: form.elements.aiResponsibility.value,
    learningGoals: selectedValues(form, "learningGoals"),
    weeklyTime: form.elements.weeklyTime.value,
    preferredFormats: selectedValues(form, "preferredFormats")
  };
}

function renderAssessmentResult(result, accuracyOptions) {
  const resultPanel = document.querySelector("#assessment-result-panel");
  const resultContent = document.querySelector("#assessment-result-content");

  resultContent.replaceChildren(
    createResultCard(
      "Practical AI fluency",
      result.practicalFluency.level.label,
      result.practicalFluency.level.description,
      result.practicalFluency.evidence
    ),
    createResultCard(
      "Technical orientation",
      result.technicalOrientation.level.label,
      result.technicalOrientation.level.description,
      result.technicalOrientation.evidence
    )
  );

  renderAccuracyControls(resultPanel, accuracyOptions);
  resultPanel.hidden = false;
  renderPathProfileSummary(result);
  renderStorageState();
}

function createResultCard(title, level, description, evidence = []) {
  const card = document.createElement("article");
  card.className = "result-card";

  const heading = document.createElement("h3");
  heading.textContent = title;
  const levelText = document.createElement("strong");
  levelText.textContent = level;
  const descriptionText = document.createElement("p");
  descriptionText.textContent = description || "";

  const evidenceList = document.createElement("ul");
  evidenceList.className = "evidence-list";

  evidence.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    evidenceList.append(listItem);
  });

  card.append(heading, levelText, descriptionText);

  if (evidence.length > 0) {
    card.append(evidenceList);
  }

  return card;
}

function renderAccuracyControls(resultPanel, accuracyOptions) {
  const container = resultPanel.querySelector("#accuracy-feedback");
  container.replaceChildren();
  const { state } = storageManager.getSnapshot();
  const savedFeedbackValue = state.assessment?.accuracyFeedback?.value || "";

  const fieldset = createFieldset("Does this profile seem accurate?");
  const stack = document.createElement("div");
  stack.className = "option-stack";

  accuracyOptions.forEach((option) => {
    stack.append(
      createOptionInput({
        type: "radio",
        name: "accuracyFeedback",
        value: option.id,
        label: option.label,
        checked: option.id === savedFeedbackValue
      })
    );
  });

  const actionRow = document.createElement("div");
  actionRow.className = "accuracy-actions";
  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.className = "secondary-action";
  saveButton.textContent = "Save feedback";
  const savedText = document.createElement("span");
  savedText.className = "selection-note";
  savedText.setAttribute("aria-live", "polite");

  saveButton.addEventListener("click", () => {
    const selected = container.querySelector('[name="accuracyFeedback"]:checked');

    if (!selected) {
      savedText.textContent = "Choose whether the result seems accurate before saving feedback.";
      return;
    }

    storageManager.saveAssessmentAccuracyFeedback(selected.value);
    savedText.textContent = "Profile accuracy feedback saved.";
    renderStorageState();
  });

  actionRow.append(saveButton, savedText);
  fieldset.append(stack, actionRow);
  container.append(fieldset);
}

function renderAssessment(appConfig, assessmentConfig) {
  const root = document.querySelector("#assessment-root");
  const form = document.createElement("form");
  form.className = "assessment-form";
  form.noValidate = true;

  const errorBox = document.createElement("div");
  errorBox.className = "form-errors";
  errorBox.id = "assessment-errors";
  errorBox.setAttribute("aria-live", "polite");
  errorBox.tabIndex = -1;
  errorBox.hidden = true;

  const primaryFieldset = createFieldset(
    "1. Which professional field best describes your primary work?",
    "Choose one primary field and up to two optional secondary fields."
  );
  const primarySelect = document.createElement("select");
  primarySelect.name = "primaryField";
  primarySelect.id = "primaryField";
  primarySelect.required = true;

  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = "Choose one field";
  primarySelect.append(placeholderOption);

  appConfig.professionalFields.forEach((field) => {
    const option = document.createElement("option");
    option.value = field;
    option.textContent = field;
    primarySelect.append(option);
  });

  const primaryLabel = document.createElement("label");
  primaryLabel.className = "selection-note";
  primaryLabel.setAttribute("for", "primaryField");
  primaryLabel.textContent = "Primary field";
  primaryFieldset.append(
    primaryLabel,
    primarySelect,
    createCompactChoiceGroup({
      title: "Optional secondary fields",
      description: "Leave this blank if no secondary field applies.",
      name: "secondaryFields",
      options: appConfig.professionalFields,
      max: appConfig.selectionRules.secondaryFieldsMaximum
    })
  );

  form.append(
    primaryFieldset,
    createCheckboxGroup({
      title: "2. Which activities best describe your work?",
      description: "Choose one to three work patterns. Professional field and work pattern are kept separate.",
      name: "workPatterns",
      options: appConfig.workPatterns,
      required: true,
      max: appConfig.selectionRules.workPatternsMaximum
    }),
    createCheckboxGroup({
      title: "3. What do you most want to learn?",
      description: "Choose one to three learning goals.",
      name: "learningGoals",
      options: assessmentConfig.learningGoals,
      required: true,
      max: appConfig.selectionRules.learningGoalsMaximum
    })
  );

  assessmentConfig.questions.forEach((question, index) => {
    const titlePrefix = `${index + 4}. `;

    if (question.type === "multiple") {
      form.append(
        createCheckboxGroup({
          title: `${titlePrefix}${question.title}`,
          name: question.id,
          options: question.options,
          required: question.required
        })
      );
    } else {
      const fieldset = createRadioGroup({ ...question, title: `${titlePrefix}${question.title}` });
      form.append(fieldset);
    }
  });

  const preferencesFieldset = createFieldset("12. Select your available time and preferred formats.");
  preferencesFieldset.append(
    createCompactChoiceGroup({
      title: "Weekly available training time",
      name: "weeklyTime",
      options: assessmentConfig.weeklyTimeOptions,
      type: "radio"
    }),
    createCompactChoiceGroup({
      title: "Preferred learning formats",
      name: "preferredFormats",
      options: assessmentConfig.preferredFormats
    })
  );
  form.append(preferencesFieldset);

  const actionRow = document.createElement("div");
  actionRow.className = "assessment-actions";
  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.className = "primary-action";
  submitButton.textContent = "Complete assessment";
  actionRow.append(submitButton);
  form.append(errorBox, actionRow);

  const resultPanel = document.createElement("section");
  resultPanel.id = "assessment-result-panel";
  resultPanel.className = "profile-summary";
  resultPanel.setAttribute("aria-labelledby", "assessment-result-title");
  resultPanel.hidden = true;
  resultPanel.innerHTML = `
    <div class="section-heading">
      <p class="eyebrow">Assessment result</p>
      <h3 id="assessment-result-title">Your profile dimensions</h3>
      <p>These dimensions guide later recommendations. They do not certify proficiency.</p>
    </div>
    <div class="assessment-results" id="assessment-result-content"></div>
    <div id="accuracy-feedback"></div>
  `;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const answers = readAssessmentAnswers(form);
    const errors = validateAssessmentAnswers(answers, appConfig, assessmentConfig);

    if (errors.length > 0) {
      errorBox.hidden = false;
      errorBox.textContent = errors.join(" ");
      errorBox.focus?.();
      setStatus("Assessment needs a few more answers before it can be completed.", true);
      return;
    }

    errorBox.hidden = true;
    const result = calculateProfile(answers, assessmentConfig, appConfig);
    const { recoverableError } = storageManager.saveAssessmentResult(result);
    renderAssessmentResult(result, assessmentConfig.accuracyOptions);
    setStatus(
      recoverableError || "Assessment complete. Your profile dimensions are shown below.",
      Boolean(recoverableError)
    );
    const prefersReducedMotion = globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultPanel.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  });

  root.replaceChildren(form, resultPanel);
  bindPrimarySecondaryExclusion(form, appConfig.selectionRules.secondaryFieldsMaximum);
  bindSelectionLimit(form, "secondaryFields", appConfig.selectionRules.secondaryFieldsMaximum);
  bindSelectionLimit(form, "workPatterns", appConfig.selectionRules.workPatternsMaximum);
  bindSelectionLimit(form, "learningGoals", appConfig.selectionRules.learningGoalsMaximum);
  bindExclusiveOption(form, "independentExperience", "none-yet");
  bindExclusiveOption(form, "preferredFormats", "no-preference");

  const { state } = storageManager.getSnapshot();
  if (state.assessment) {
    populateAssessmentForm(form, state.assessment.answers);
    renderAssessmentResult(state.assessment, assessmentConfig.accuracyOptions);
  }
}

function renderPathStages(stages) {
  const container = document.querySelector("#path-stage-list");
  const list = document.createElement("ol");

  stages.forEach((stage) => {
    const item = document.createElement("li");
    item.textContent = stage;
    list.append(item);
  });

  container.replaceChildren(list);
}

function createCatalogCard(resource) {
  const card = document.createElement("article");
  card.className = "catalog-card";

  const label = document.createElement("span");
  const isPractice = resource.provider === "AI Training Pathfinder";
  const needsReview = resource.active === false || resource.verificationStatus === "manual-review";
  label.className = resource.sampleData || needsReview
    ? "sample-label"
    : isPractice
      ? "practice-label"
      : "verified-label";
  label.textContent = resource.sampleData
    ? "Unverified sample data"
    : needsReview
      ? "Inactive provisional"
      : isPractice
        ? "Internal practice"
        : resource.resourceType === "guided-reference-activity"
          ? "Guided reference activity"
          : "Verified free resource";

  const heading = document.createElement("h3");
  heading.textContent = resource.title;

  const provider = document.createElement("p");
  provider.textContent = `Provider: ${resource.provider}`;

  const description = document.createElement("p");
  description.textContent = resource.description;

  const meta = document.createElement("p");
  meta.className = "resource-meta";
  meta.textContent = `${resource.pathStage || "Resource"} • ${resource.format || "Format not stated"} • ${formatDuration(resource.estimatedMinutes, resource.durationNote)}`;

  const evidence = document.createElement("p");
  evidence.textContent = needsReview
    ? resource.evidenceNote || "This resource needs manual review before it can be recommended."
    : resource.evidenceNote || resource.safetyReminder || "";

  card.append(label, heading, provider, meta, description, evidence);

  if (resource.url && resource.url !== "#") {
    const link = document.createElement("a");
    link.className = "resource-link";
    link.href = resource.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Open resource";
    card.append(link);
  }

  return card;
}

function renderCatalog(catalog, practiceCards) {
  const container = document.querySelector("#catalog-list");
  const cards = [
    ...catalog.map(createCatalogCard),
    ...practiceCards.map((practiceCard) =>
      createCatalogCard({
        ...practiceCard,
        evidenceNote: "Internal fictional practice card. It uses only nonsensitive sample scenarios.",
        sampleData: false
      })
    )
  ];

  container.replaceChildren(...cards);
}

function renderStorageState() {
  const { state, recoverableError } = storageManager.getSnapshot();
  const startedElement = document.querySelector("#guest-started");
  const modeElement = document.querySelector("#storage-mode");
  const healthElement = document.querySelector("#storage-health");
  const assessmentStatusElement = document.querySelector("#assessment-storage-status");

  modeElement.textContent = state.mode === "guest" ? "Guest" : state.mode;
  startedElement.textContent = state.guestStartedAt
    ? new Date(state.guestStartedAt).toLocaleString()
    : "Not started";
  healthElement.textContent = recoverableError || "Ready";
  assessmentStatusElement.textContent = state.assessment
    ? `Completed ${new Date(state.assessment.completedAt).toLocaleDateString()}`
    : "Not completed";

  if (recoverableError) {
    setStatus(recoverableError, true);
  }
}

function renderPathProfileSummary(result = null) {
  const container = document.querySelector("#path-profile-summary");
  const { state } = storageManager.getSnapshot();
  const assessment = result || state.assessment;

  if (!assessment) {
    container.replaceChildren(
      createCard(
        "Assessment needed",
        "Complete the assessment to generate a five-stage learning path."
      )
    );
    renderPathStages(appData.appConfig?.learningPathStages || []);
    return;
  }

  container.replaceChildren(
    createResultCard(
      "Practical AI fluency",
      assessment.practicalFluency.level.label,
      assessment.practicalFluency.level.description,
      assessment.practicalFluency.evidence || []
    ),
    createResultCard(
      "Technical orientation",
      assessment.technicalOrientation.level.label,
      assessment.technicalOrientation.level.description,
      assessment.technicalOrientation.evidence || []
    )
  );
  container.className = "assessment-results";
  renderRecommendedPath(assessment);
}

function createRecommendationCard(item) {
  const card = document.createElement("article");
  card.className = "path-item";

  const label = document.createElement("span");
  label.className = item.type === "practice" ? "practice-label" : "verified-label";
  label.textContent = item.type === "practice" ? "Internal practice" : "Verified resource";

  const heading = document.createElement("h4");
  heading.textContent = item.title;

  const provider = document.createElement("p");
  provider.className = "resource-meta";
  provider.textContent = `${item.provider} • ${item.format || "Format not stated"} • ${formatDuration(item.estimatedMinutes, item.durationNote)}`;

  const description = document.createElement("p");
  description.textContent = item.description;

  const reasons = document.createElement("ul");
  reasons.className = "evidence-list";
  item.reasons.forEach((reason) => {
    const listItem = document.createElement("li");
    listItem.textContent = reason;
    reasons.append(listItem);
  });

  card.append(label, heading, provider, description);

  if (item.reasons.length > 0) {
    card.append(reasons);
  }

  if (item.type === "practice" && item.deliverable) {
    const deliverable = document.createElement("p");
    deliverable.className = "selection-note";
    deliverable.textContent = `Practice deliverable: ${item.deliverable}`;
    card.append(deliverable);
  }

  if (item.safetyReminder) {
    const reminder = document.createElement("p");
    reminder.className = "handling-reminder";
    reminder.textContent = item.safetyReminder;
    card.append(reminder);
  }

  if (item.url) {
    const link = document.createElement("a");
    link.className = "resource-link";
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Open resource";
    card.append(link);
  }

  return card;
}

function renderRecommendedPath(assessment) {
  const container = document.querySelector("#path-stage-list");
  const path = buildLearningPath(
    assessment,
    appData.catalog,
    appData.practiceCards,
    appData.recommendationConfig
  );

  if (!path) {
    renderPathStages(appData.appConfig?.learningPathStages || []);
    return;
  }

  const sections = path.stages.map((stage) => {
    const section = document.createElement("section");
    section.className = "path-stage";
    section.setAttribute("aria-labelledby", `${stage.stage.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-title`);

    const heading = document.createElement("h3");
    heading.id = `${stage.stage.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-title`;
    heading.textContent = stage.stage;

    const itemGrid = document.createElement("div");
    itemGrid.className = "path-item-grid";
    itemGrid.replaceChildren(...stage.items.map(createRecommendationCard));

    section.append(heading, itemGrid);
    return section;
  });

  container.replaceChildren(...sections);
}

function bindNavigation() {
  navButtons.forEach((button) => {
    const activate = () => {
      setView(button.dataset.view, { focusMain: true });
      renderStorageState();
    };

    button.addEventListener("click", activate);
  });

  document.querySelectorAll("[data-view-target]").forEach((button) => {
    const activate = () => {
      setView(button.dataset.viewTarget, { focusMain: true });
      renderStorageState();
    };

    button.addEventListener("click", activate);
  });

  const guestButton = document.querySelector("[data-start-guest]");
  const startGuest = () => {
    const { recoverableError } = storageManager.startGuestSession();
    setView("assessment", { focusMain: true });
    renderStorageState();
    setStatus(
      recoverableError || "Guest mode started. You can complete the assessment now.",
      Boolean(recoverableError)
    );
  };

  guestButton.addEventListener("click", startGuest);
}

async function init() {
  bindNavigation();

  try {
    const [configuration, catalog] = await Promise.all([loadConfiguration(), loadCatalog()]);
    appData.appConfig = configuration.appConfig;
    appData.assessmentConfig = configuration.assessment;
    appData.recommendationConfig = configuration.recommendation;
    appData.catalog = catalog;
    appData.practiceCards = configuration.appliedPracticeCards;

    renderAssessment(configuration.appConfig, configuration.assessment);
    renderPathStages(configuration.appConfig.learningPathStages);
    renderPathProfileSummary();
    renderCatalog(catalog, configuration.appliedPracticeCards);
    renderStorageState();

    const { state, recoverableError } = storageManager.getSnapshot();
    setView(state.activeView || "home");

    if (recoverableError) {
      setStatus(recoverableError, true);
    }
  } catch (error) {
    setStatus(
      "Some application data could not be loaded. Check that the site is running from a local static server.",
      true
    );
  }
}

init();
