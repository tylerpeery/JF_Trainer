import { loadCatalog } from "./catalog.js";
import {
  browsableCatalogItems,
  catalogFilterOptions,
  countActiveFilters,
  createDefaultCatalogFilters,
  filterCatalogItems,
  sortCatalogItems
} from "./catalog-filters.js";
import { loadConfiguration } from "./configuration.js";
import { calculateProfile } from "./assessment.js";
import { validateAssessmentAnswers } from "./assessment-validation.js";
import { initializeAccountMode } from "./account-mode.js";
import { buildProgressSummary } from "./progress.js";
import { buildLearningPath } from "./recommendations.js";
import { createStorageManager } from "./storage/storage-manager.js";

const panels = Array.from(document.querySelectorAll("[data-view-panel]"));
const navButtons = Array.from(document.querySelectorAll(".nav-link"));
const statusPanel = document.querySelector(".status-panel");
const statusText = document.querySelector("#app-status");
const mainContent = document.querySelector("#main-content");
let storageManager = createStorageManager();
let catalogFilters = createDefaultCatalogFilters();
let catalogDrawerOpen = false;
const catalogFilterGroupState = {
  professionalField: true,
  workPattern: true,
  practicalFluency: true,
  technicalOrientation: false,
  pathStage: true,
  provider: false,
  format: false,
  duration: false,
  certificate: false,
  access: false,
  completion: false,
  tags: false
};
const catalogFilterShowAll = {};
const appData = {
  appConfig: null,
  assessmentConfig: null,
  recommendationConfig: null,
  supabaseConfig: null,
  catalog: [],
  practiceCards: [],
  milestones: [],
  achievements: []
};

function setStatus(message, isError = false) {
  if (!statusPanel || !statusText) {
    return;
  }

  statusText.textContent = message || "";
  statusPanel.hidden = !message;
  statusPanel.dataset.error = isError ? "true" : "false";
}

function showCompletionCelebration(message = "Completion recorded") {
  const toast = document.createElement("div");
  toast.className = "completion-celebration";
  toast.setAttribute("aria-hidden", "true");
  toast.textContent = message;
  document.body.append(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 1800);
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

function formatHours(minutes) {
  return `${(minutes / 60).toFixed(1)} hr`;
}

function allTrackableItems() {
  return [
    ...appData.catalog.map((item) => ({ ...item, type: "resource" })),
    ...appData.practiceCards.map((item) => ({ ...item, type: "practice" }))
  ];
}

function findTrackableItem(resourceId) {
  return allTrackableItems().find((item) => item.id === resourceId) || null;
}

function progressRecordFor(resourceId) {
  return storageManager.getSnapshot().state.progress.resourceStates[resourceId] || null;
}

function progressSummary() {
  return buildProgressSummary(
    storageManager.getSnapshot().state,
    appData.milestones,
    appData.achievements
  );
}

function isTrackable(item) {
  return item.active !== false && !item.sampleData;
}

function createTextInput({ id, label, value = "", type = "text", placeholder = "" }) {
  const wrapper = document.createElement("label");
  wrapper.className = "progress-field";
  wrapper.setAttribute("for", id);

  const labelText = document.createElement("span");
  labelText.textContent = label;
  const input = document.createElement("input");
  input.id = id;
  input.type = type;
  input.value = value || "";
  input.placeholder = placeholder;

  wrapper.append(labelText, input);
  return { wrapper, input };
}

function createSelectInput({ id, label, value = "", options }) {
  const wrapper = document.createElement("label");
  wrapper.className = "progress-field";
  wrapper.setAttribute("for", id);

  const labelText = document.createElement("span");
  labelText.textContent = label;
  const select = document.createElement("select");
  select.id = id;

  options.forEach((option) => {
    const optionElement = document.createElement("option");
    optionElement.value = option.value;
    optionElement.textContent = option.label;
    select.append(optionElement);
  });

  select.value = value || "";
  wrapper.append(labelText, select);
  return { wrapper, input: select };
}

function createTakeawayInput(id, value = "") {
  const wrapper = document.createElement("label");
  wrapper.className = "progress-field";
  wrapper.setAttribute("for", id);

  const labelText = document.createElement("span");
  labelText.textContent = "Optional takeaway";
  const textarea = document.createElement("textarea");
  textarea.id = id;
  textarea.rows = 3;
  textarea.maxLength = 500;
  textarea.value = value || "";
  textarea.placeholder = "Use only nonsensitive notes.";

  wrapper.append(labelText, textarea);
  return { wrapper, input: textarea };
}

function refreshProgressViews() {
  renderStorageState();
  renderProgressDashboard();
  renderPathProfileSummary();
  renderCatalog(appData.catalog, appData.practiceCards);
}

function renderDynamicViews() {
  renderAssessment(appData.appConfig, appData.assessmentConfig);
  renderPathProfileSummary();
  renderCatalog(appData.catalog, appData.practiceCards);
  renderProgressDashboard();
  renderStorageState();
}

function createProgressControls(resourceId) {
  const item = findTrackableItem(resourceId);
  const wrapper = document.createElement("div");
  wrapper.className = "progress-controls";

  if (!item || !isTrackable(item)) {
    return wrapper;
  }

  const record = progressRecordFor(resourceId);
  const status = document.createElement("p");
  status.className = "selection-note";
  status.setAttribute("aria-live", "polite");
  status.textContent = record?.status === "completed"
    ? `Completed${record.completionDate ? ` on ${record.completionDate}` : ""}.`
    : record?.status === "started"
      ? "Started. Completion is recorded by your attestation."
      : "Not started.";

  const actions = document.createElement("div");
  actions.className = "progress-action-row";

  const startButton = document.createElement("button");
  startButton.type = "button";
  startButton.className = "secondary-action compact-action";
  startButton.textContent = record ? "Started" : "Start";
  startButton.disabled = Boolean(record);
  startButton.addEventListener("click", () => {
    const { recoverableError } = storageManager.startResource(item, item.type);
    setStatus(recoverableError || "Resource started.", Boolean(recoverableError));
    refreshProgressViews();
  });

  actions.append(startButton);

  const details = document.createElement("details");
  details.className = "completion-details";
  details.open = record?.status === "completed";

  const summary = document.createElement("summary");
  summary.textContent = record?.status === "completed" ? "Completion notes and feedback" : "Mark complete";

  const completionDate = createTextInput({
    id: `${resourceId}-completion-date`,
    label: "Optional completion date",
    type: "date",
    value: record?.completionDate || ""
  });
  const takeaway = createTakeawayInput(`${resourceId}-takeaway`, record?.takeaway || "");
  const relevance = createSelectInput({
    id: `${resourceId}-relevance`,
    label: "Optional relevance",
    value: record?.relevance || "",
    options: [
      { value: "", label: "Not rated" },
      { value: "1", label: "1 - Low relevance" },
      { value: "2", label: "2" },
      { value: "3", label: "3" },
      { value: "4", label: "4" },
      { value: "5", label: "5 - High relevance" }
    ]
  });
  const difficulty = createSelectInput({
    id: `${resourceId}-difficulty`,
    label: "Optional difficulty",
    value: record?.difficulty || "",
    options: [
      { value: "", label: "Not rated" },
      { value: "too-easy", label: "Too easy" },
      { value: "appropriate", label: "Appropriate" },
      { value: "too-difficult", label: "Too difficult" }
    ]
  });

  const note = document.createElement("p");
  note.className = "handling-reminder";
  note.textContent = "Use only nonsensitive notes. Do not enter protected, operational, medical, personal, or proprietary information.";

  const completeButton = document.createElement("button");
  completeButton.type = "button";
  completeButton.className = "primary-action compact-action";
  completeButton.textContent = record?.status === "completed" ? "Save feedback" : "Mark complete";
  completeButton.addEventListener("click", () => {
    const wasCompleted = record?.status === "completed";
    const input = {
      completionDate: completionDate.input.value,
      takeaway: takeaway.input.value,
      relevance: relevance.input.value,
      difficulty: difficulty.input.value
    };
    const result = wasCompleted
      ? storageManager.saveResourceFeedback(resourceId, input)
      : storageManager.completeResource(item, item.type, input, appData.milestones, appData.achievements);

    setStatus(
      result.recoverableError || (wasCompleted ? "Progress feedback saved." : "Completion recorded."),
      Boolean(result.recoverableError)
    );
    if (!wasCompleted && !result.recoverableError) {
      showCompletionCelebration();
    }
    refreshProgressViews();
  });

  const undoButton = document.createElement("button");
  undoButton.type = "button";
  undoButton.className = "secondary-action compact-action";
  undoButton.textContent = "Undo completion";
  undoButton.hidden = record?.status !== "completed";
  undoButton.addEventListener("click", () => {
    const result = storageManager.undoResourceCompletion(resourceId, appData.milestones, appData.achievements);
    setStatus(result.recoverableError || "Completion undone. Time and points were recalculated.", Boolean(result.recoverableError));
    refreshProgressViews();
  });

  const completionActions = document.createElement("div");
  completionActions.className = "progress-action-row";
  completionActions.append(completeButton, undoButton);

  details.append(
    summary,
    completionDate.wrapper,
    takeaway.wrapper,
    relevance.wrapper,
    difficulty.wrapper,
    note,
    completionActions
  );

  wrapper.append(status, actions, details);
  return wrapper;
}

function createOptionInput({ type, name, value, label, description = "", checked = false, idPrefix = "" }) {
  const optionId = `${idPrefix}${name}-${String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
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
    storageManager.refreshAchievements(appData.milestones, appData.achievements);
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

const catalogFilterGroups = [
  { name: "professionalField", title: "Professional field", limit: 6 },
  { name: "workPattern", title: "Work pattern", limit: 6 },
  { name: "practicalFluency", title: "Practical AI fluency", limit: 4 },
  { name: "technicalOrientation", title: "Technical orientation", limit: 4 },
  { name: "pathStage", title: "Learning category", limit: 5 },
  { name: "provider", title: "Provider", limit: 5 },
  { name: "format", title: "Format", limit: 5 },
  { name: "duration", title: "Duration", limit: 5 },
  { name: "certificate", title: "Certificate availability", limit: 5 },
  { name: "access", title: "Access status", limit: 5 },
  { name: "completion", title: "Progress status", limit: 3 },
  { name: "tags", title: "Tags", limit: 8 }
];

function catalogProgressRecords() {
  return storageManager.getSnapshot().state.progress.resourceStates || {};
}

function resetCatalogFilters() {
  catalogFilters = createDefaultCatalogFilters();
  renderCatalog(appData.catalog, appData.practiceCards);
}

function updateCatalogFilter(name, values) {
  catalogFilters = {
    ...catalogFilters,
    [name]: values
  };
  renderCatalog(appData.catalog, appData.practiceCards);
}

function optionLookup(options) {
  const lookup = {};

  Object.entries(options).forEach(([groupName, groupOptions]) => {
    lookup[groupName] = new Map(groupOptions.map((option) => [option.id, option.label]));
  });

  return lookup;
}

function catalogFilterDescriptors(options) {
  const lookup = optionLookup(options);
  const descriptors = [];

  if (catalogFilters.search.trim()) {
    descriptors.push({
      group: "search",
      groupLabel: "Search",
      value: catalogFilters.search,
      label: `Search: ${catalogFilters.search}`,
      removeLabel: "Clear search filter"
    });
  }

  catalogFilterGroups.forEach((group) => {
    const selectedValuesForGroup = catalogFilters[group.name] || [];
    selectedValuesForGroup.forEach((value) => {
      const label = lookup[group.name]?.get(value) || value;
      descriptors.push({
        group: group.name,
        groupLabel: group.title,
        value,
        label,
        removeLabel: `Remove ${group.title.toLowerCase()} filter ${label}`
      });
    });
  });

  return descriptors;
}

function removeCatalogFilter(descriptor) {
  if (descriptor.group === "search") {
    catalogFilters = {
      ...catalogFilters,
      search: ""
    };
  } else {
    catalogFilters = {
      ...catalogFilters,
      [descriptor.group]: (catalogFilters[descriptor.group] || []).filter((value) => value !== descriptor.value)
    };
  }

  renderCatalog(appData.catalog, appData.practiceCards);
}

function createCatalogFilterGroup({ group, options = [], idPrefix }) {
  const section = document.createElement("section");
  section.className = "catalog-filter-group";
  const isOpen = catalogFilterGroupState[group.name] !== false;
  const contentId = `${idPrefix}-${group.name}-content`;
  const visibleOptions = catalogFilterShowAll[group.name] ? options : options.slice(0, group.limit);

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "catalog-filter-toggle";
  toggle.setAttribute("aria-expanded", String(isOpen));
  toggle.setAttribute("aria-controls", contentId);
  toggle.textContent = group.title;
  toggle.addEventListener("click", () => {
    catalogFilterGroupState[group.name] = !isOpen;
    renderCatalog(appData.catalog, appData.practiceCards);
  });

  const content = document.createElement("div");
  content.id = contentId;
  content.className = "catalog-filter-group-content";
  content.hidden = !isOpen;

  const optionStack = document.createElement("div");
  optionStack.className = "option-stack catalog-filter-options";

  visibleOptions.forEach((option) => {
    optionStack.append(
      createOptionInput({
        type: "checkbox",
        name: group.name,
        value: option.id,
        label: `${option.label} (${option.count || 0})`,
        checked: catalogFilters[group.name]?.includes(option.id),
        idPrefix: `${idPrefix}-`
      })
    );
  });

  if (options.length === 0) {
    const empty = document.createElement("p");
    empty.className = "selection-note";
    empty.textContent = "No values available.";
    content.append(empty);
  } else {
    content.append(optionStack);
  }

  if (options.length > group.limit) {
    const showMore = document.createElement("button");
    showMore.type = "button";
    showMore.className = "secondary-action compact-action catalog-show-more";
    showMore.textContent = catalogFilterShowAll[group.name] ? "Show fewer" : `Show ${options.length - group.limit} more`;
    showMore.addEventListener("click", () => {
      catalogFilterShowAll[group.name] = !catalogFilterShowAll[group.name];
      renderCatalog(appData.catalog, appData.practiceCards);
    });
    content.append(showMore);
  }

  section.addEventListener("change", () => {
    updateCatalogFilter(group.name, selectedValues(section, group.name));
  });

  section.append(toggle, content);
  return section;
}

function createCatalogFilterControls({ options, idPrefix, includeClose = false, closeDialog = null }) {
  const wrapper = document.createElement("div");
  wrapper.className = "catalog-filter-panel";

  const header = document.createElement("div");
  header.className = "catalog-filter-header";
  const heading = document.createElement("h3");
  heading.id = `${idPrefix}-title`;
  heading.textContent = "Filters";
  const activeCount = countActiveFilters(catalogFilters);

  header.append(heading);

  if (includeClose) {
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "secondary-action compact-action";
    closeButton.textContent = "Close";
    closeButton.addEventListener("click", () => closeDialog?.());
    header.append(closeButton);
  }

  const helper = document.createElement("p");
  helper.className = "selection-note catalog-filter-note";
  helper.textContent = "Use broad, nonsensitive categories only. Do not disclose mission, unit, system, location, or operational details.";

  const groups = document.createElement("div");
  groups.className = "catalog-filter-groups";
  catalogFilterGroups.forEach((group) => {
    groups.append(createCatalogFilterGroup({ group, options: options[group.name] || [], idPrefix }));
  });

  const actions = document.createElement("div");
  actions.className = "catalog-filter-actions";
  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.className = "secondary-action compact-action";
  resetButton.textContent = activeCount > 0 ? `Reset filters (${activeCount})` : "Reset filters";
  resetButton.disabled = activeCount === 0;
  resetButton.addEventListener("click", resetCatalogFilters);
  actions.append(resetButton);

  wrapper.append(header, helper, groups, actions);
  return wrapper;
}

function renderCatalogFilters(options) {
  const root = document.querySelector("#catalog-filter-root");

  if (!root) {
    return;
  }

  const sidebar = document.createElement("aside");
  sidebar.className = "catalog-sidebar";
  sidebar.setAttribute("aria-labelledby", "catalog-sidebar-title");
  sidebar.append(createCatalogFilterControls({ options, idPrefix: "catalog-sidebar" }));

  const dialog = document.createElement("dialog");
  dialog.className = "catalog-filter-dialog";
  dialog.setAttribute("aria-labelledby", "catalog-dialog-title");

  const closeDialog = () => {
    catalogDrawerOpen = false;
    dialog.close();
  };

  dialog.append(createCatalogFilterControls({
    options,
    idPrefix: "catalog-dialog",
    includeClose: true,
    closeDialog
  }));

  dialog.addEventListener("close", () => {
    catalogDrawerOpen = false;
    document.querySelector("[data-open-catalog-filters]")?.focus();
  });

  root.replaceChildren(sidebar, dialog);

  if (catalogDrawerOpen && !dialog.open) {
    window.requestAnimationFrame(() => {
      if (!dialog.open) {
        if (typeof dialog.showModal === "function") {
          dialog.showModal();
        } else {
          dialog.setAttribute("open", "");
        }
        dialog.querySelector("button, input, select")?.focus();
      }
    });
  }
}

function renderCatalogToolbar(filteredItems, totalItems) {
  const root = document.querySelector("#catalog-toolbar-root");

  if (!root) {
    return;
  }

  const toolbar = document.createElement("div");
  toolbar.className = "catalog-toolbar";

  const count = document.createElement("p");
  count.className = "catalog-result-count";
  count.setAttribute("aria-live", "polite");
  count.textContent = `${filteredItems.length} training resources`;
  if (filteredItems.length !== totalItems) {
    count.textContent += ` of ${totalItems}`;
  }

  const searchLabel = document.createElement("label");
  searchLabel.className = "catalog-search";
  searchLabel.setAttribute("for", "catalog-search");
  const searchText = document.createElement("span");
  searchText.className = "visually-hidden";
  searchText.textContent = "Search catalog";
  const searchInput = document.createElement("input");
  searchInput.id = "catalog-search";
  searchInput.type = "search";
  searchInput.placeholder = "Search title, provider, tags";
  searchInput.value = catalogFilters.search;
  searchInput.addEventListener("input", () => {
    catalogFilters = {
      ...catalogFilters,
      search: searchInput.value
    };
    renderCatalog(appData.catalog, appData.practiceCards);
  });
  searchLabel.append(searchText, searchInput);

  const sortLabel = document.createElement("label");
  sortLabel.className = "catalog-sort";
  sortLabel.setAttribute("for", "catalog-sort");
  const sortText = document.createElement("span");
  sortText.className = "visually-hidden";
  sortText.textContent = "Sort catalog";
  const sortSelect = document.createElement("select");
  sortSelect.id = "catalog-sort";
  [
    ["title-asc", "Title"],
    ["provider", "Provider"],
    ["duration", "Shortest duration"]
  ].forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    option.selected = catalogFilters.sort === value;
    sortSelect.append(option);
  });
  sortSelect.addEventListener("change", () => {
    catalogFilters = {
      ...catalogFilters,
      sort: sortSelect.value
    };
    renderCatalog(appData.catalog, appData.practiceCards);
  });
  sortLabel.append(sortText, sortSelect);

  const activeCount = countActiveFilters(catalogFilters);
  const filterButton = document.createElement("button");
  filterButton.type = "button";
  filterButton.className = "secondary-action compact-action catalog-mobile-filter-button";
  filterButton.dataset.openCatalogFilters = "true";
  filterButton.textContent = activeCount > 0 ? `Filters (${activeCount})` : "Filters";
  filterButton.addEventListener("click", () => {
    catalogDrawerOpen = true;
    renderCatalog(appData.catalog, appData.practiceCards);
  });

  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "secondary-action compact-action";
  clearButton.textContent = "Clear all";
  clearButton.hidden = activeCount === 0;
  clearButton.addEventListener("click", resetCatalogFilters);

  toolbar.append(count, searchLabel, sortLabel, filterButton, clearButton);
  root.replaceChildren(toolbar);
}

function renderActiveCatalogFilters(options) {
  const root = document.querySelector("#catalog-active-filter-root");

  if (!root) {
    return;
  }

  const descriptors = catalogFilterDescriptors(options);
  if (descriptors.length === 0) {
    root.replaceChildren();
    return;
  }

  const chipBar = document.createElement("div");
  chipBar.className = "active-filter-chips";

  descriptors.forEach((descriptor) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "filter-chip";
    chip.textContent = `${descriptor.label} x`;
    chip.setAttribute("aria-label", descriptor.removeLabel);
    chip.addEventListener("click", () => removeCatalogFilter(descriptor));
    chipBar.append(chip);
  });

  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "secondary-action compact-action";
  clearButton.textContent = "Clear all";
  clearButton.addEventListener("click", resetCatalogFilters);
  chipBar.append(clearButton);

  root.replaceChildren(chipBar);
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
  meta.textContent = `${resource.pathStage || "Resource"} - ${resource.format || "Format not stated"} - ${formatDuration(resource.estimatedMinutes, resource.durationNote)}`;

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

  card.append(createProgressControls(resource.id));

  return card;
}

function renderCatalog(catalog, practiceCards) {
  const container = document.querySelector("#catalog-list");
  const activeElementId = document.activeElement?.id || "";
  const selectionStart = typeof document.activeElement?.selectionStart === "number"
    ? document.activeElement.selectionStart
    : null;
  const selectionEnd = typeof document.activeElement?.selectionEnd === "number"
    ? document.activeElement.selectionEnd
    : null;
  const items = browsableCatalogItems(catalog, practiceCards);
  const progressRecords = catalogProgressRecords();
  const options = catalogFilterOptions(items, appData.appConfig || {}, progressRecords);
  const filteredItems = sortCatalogItems(
    filterCatalogItems(items, catalogFilters, progressRecords),
    catalogFilters.sort
  );
  const restoreCatalogFocus = () => {
    if (activeElementId === "catalog-search") {
      const searchInput = document.querySelector("#catalog-search");
      searchInput?.focus();
      if (selectionStart !== null && selectionEnd !== null) {
        searchInput?.setSelectionRange(selectionStart, selectionEnd);
      }
    }
  };

  renderCatalogFilters(options);
  renderCatalogToolbar(filteredItems, items.length);
  renderActiveCatalogFilters(options);

  if (filteredItems.length === 0) {
    const empty = document.createElement("div");
    empty.className = "catalog-empty-state";
    const heading = document.createElement("h3");
    heading.textContent = "No training resources match the selected filters.";
    const body = document.createElement("p");
    body.textContent = "Try removing the most specific filters first, such as tags, duration, certificate, or completion status.";
    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "primary-action compact-action";
    clearButton.textContent = "Clear filters";
    clearButton.addEventListener("click", resetCatalogFilters);
    empty.append(heading, body, clearButton);
    container.replaceChildren(empty);
    restoreCatalogFocus();
    return;
  }

  container.replaceChildren(...filteredItems.map(createCatalogCard));
  restoreCatalogFocus();
}

function renderProgressDashboard() {
  const container = document.querySelector("#progress-root");

  if (!container) {
    return;
  }

  const { state } = storageManager.getSnapshot();
  const summary = progressSummary();
  const dashboard = document.createElement("div");
  dashboard.className = "progress-dashboard";

  const stats = document.createElement("div");
  stats.className = "progress-stats";
  [
    ["Started", summary.startedCount],
    ["Completed", summary.completedCount],
    ["Learning time", formatHours(summary.totalMinutes)],
    ["Progress points", summary.progressPoints]
  ].forEach(([label, value]) => {
    const card = document.createElement("article");
    card.className = "progress-stat";
    const heading = document.createElement("h3");
    heading.textContent = label;
    const strong = document.createElement("strong");
    strong.textContent = String(value);
    card.append(heading, strong);
    stats.append(card);
  });

  const milestoneSection = document.createElement("section");
  milestoneSection.className = "progress-section";
  milestoneSection.setAttribute("aria-labelledby", "milestone-title");
  const milestoneHeading = document.createElement("h3");
  milestoneHeading.id = "milestone-title";
  milestoneHeading.textContent = "Milestones";
  const milestoneDisclaimer = document.createElement("p");
  milestoneDisclaimer.className = "selection-note";
  milestoneDisclaimer.textContent = "Milestones measure learning engagement only. They do not certify proficiency, authorization, readiness, or expertise.";
  const milestoneList = document.createElement("ol");
  milestoneList.className = "milestone-list";

  summary.milestones.forEach((milestone) => {
    const item = document.createElement("li");
    item.className = milestone.earned ? "milestone-earned" : "milestone-pending";
    const name = document.createElement("strong");
    name.textContent = milestone.name;
    const details = document.createElement("span");
    details.textContent = `${milestone.requiredHours} hr - ${milestone.description}`;
    item.append(name, details);
    milestoneList.append(item);
  });

  milestoneSection.append(milestoneHeading, milestoneDisclaimer, milestoneList);

  const achievementSection = document.createElement("section");
  achievementSection.className = "progress-section";
  achievementSection.setAttribute("aria-labelledby", "achievement-title");
  const achievementHeading = document.createElement("h3");
  achievementHeading.id = "achievement-title";
  achievementHeading.textContent = "Achievement cabinet";
  const achievementGrid = document.createElement("div");
  achievementGrid.className = "achievement-grid";

  summary.achievements.forEach((achievement) => {
    const badge = document.createElement("article");
    badge.className = achievement.earned ? "achievement-badge earned" : "achievement-badge";
    const label = document.createElement("strong");
    label.textContent = achievement.name;
    const description = document.createElement("p");
    description.textContent = achievement.description;
    const status = document.createElement("span");
    status.textContent = achievement.earned ? "Earned" : "Not yet earned";
    badge.append(label, description, status);
    achievementGrid.append(badge);
  });

  achievementSection.append(achievementHeading, achievementGrid);

  const historySection = createLearningHistorySection(state);
  const reflectionSection = createMilestoneReflectionSection(state, summary);
  const actions = createGuestDataActions();

  dashboard.append(stats, milestoneSection, achievementSection, historySection, reflectionSection, actions);
  container.replaceChildren(dashboard);
}

function createLearningHistorySection(state) {
  const section = document.createElement("section");
  section.className = "progress-section";
  section.setAttribute("aria-labelledby", "history-title");

  const heading = document.createElement("h3");
  heading.id = "history-title";
  heading.textContent = "Learning history";

  const records = Object.values(state.progress.resourceStates || {})
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));

  section.append(heading);

  if (records.length === 0) {
    const empty = document.createElement("p");
    empty.className = "selection-note";
    empty.textContent = "Start or complete a recommended resource to build your guest learning history.";
    section.append(empty);
    return section;
  }

  const list = document.createElement("ol");
  list.className = "learning-history-list";

  records.forEach((record) => {
    const item = document.createElement("li");
    const title = document.createElement("strong");
    title.textContent = record.title;
    const details = document.createElement("span");
    details.textContent = [
      record.status === "completed" ? "Completed" : "Started",
      record.provider,
      record.pathStage,
      formatDuration(record.estimatedMinutes, record.durationNote)
    ].filter(Boolean).join(" - ");
    item.append(title, details);

    if (record.takeaway) {
      const takeaway = document.createElement("p");
      takeaway.textContent = `Takeaway: ${record.takeaway}`;
      item.append(takeaway);
    }

    list.append(item);
  });

  section.append(list);
  return section;
}

function createMilestoneReflectionSection(state, summary) {
  const section = document.createElement("section");
  section.className = "progress-section";
  section.setAttribute("aria-labelledby", "reflection-title");

  const heading = document.createElement("h3");
  heading.id = "reflection-title";
  heading.textContent = "Optional milestone reflections";

  const description = document.createElement("p");
  description.className = "selection-note";
  description.textContent = "Five- and ten-hour reflections are optional. Use only fictional, generalized, or nonsensitive examples.";

  section.append(heading, description);

  const eligibleMilestones = summary.milestones.filter((milestone) => {
    return milestone.earned && (milestone.id === "adoption-momentum" || milestone.id === "applied-foundation");
  });

  if (eligibleMilestones.length === 0) {
    const empty = document.createElement("p");
    empty.className = "selection-note";
    empty.textContent = "Reflection prompts appear after the five- and ten-hour engagement milestones.";
    section.append(empty);
    return section;
  }

  eligibleMilestones.forEach((milestone) => {
    const saved = state.progress.milestoneReflections?.[milestone.id] || {};
    const form = document.createElement("form");
    form.className = "reflection-form";

    const title = document.createElement("h4");
    title.textContent = milestone.name;

    const usingAiMore = createSelectInput({
      id: `${milestone.id}-using-ai-more`,
      label: "Are you using AI more frequently?",
      value: saved.usingAiMore || "",
      options: [
        { value: "", label: "No response" },
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
        { value: "not-sure", label: "Not sure" }
      ]
    });
    const confidence = createSelectInput({
      id: `${milestone.id}-confidence`,
      label: "Are you more confident evaluating AI output?",
      value: saved.evaluatingOutputConfidence || "",
      options: [
        { value: "", label: "No response" },
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
        { value: "not-sure", label: "Not sure" }
      ]
    });
    const example = createTakeawayInput(`${milestone.id}-example`, saved.nonsensitiveExample || "");
    example.wrapper.querySelector("span").textContent = "Optional nonsensitive example";

    const save = document.createElement("button");
    save.type = "submit";
    save.className = "secondary-action compact-action";
    save.textContent = "Save reflection";
    const savedText = document.createElement("span");
    savedText.className = "selection-note";
    savedText.setAttribute("aria-live", "polite");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const result = storageManager.saveMilestoneReflection(milestone.id, {
        usingAiMore: usingAiMore.input.value,
        evaluatingOutputConfidence: confidence.input.value,
        nonsensitiveExample: example.input.value
      });
      savedText.textContent = result.recoverableError || "Reflection saved.";
      renderStorageState();
    });

    const row = document.createElement("div");
    row.className = "progress-action-row";
    row.append(save, savedText);

    form.append(title, usingAiMore.wrapper, confidence.wrapper, example.wrapper, row);
    section.append(form);
  });

  return section;
}

function createGuestDataActions() {
  const section = document.createElement("section");
  section.className = "progress-section";
  section.setAttribute("aria-labelledby", "guest-data-title");
  const { state } = storageManager.getSnapshot();
  const isAccountMode = state.mode === "account";

  const heading = document.createElement("h3");
  heading.id = "guest-data-title";
  heading.textContent = isAccountMode ? "Account data" : "Guest data";

  const description = document.createElement("p");
  description.className = "selection-note";
  description.textContent = isAccountMode
    ? "Account data is saved to the configured Supabase project for the signed-in user. Export before resetting if you want a local record."
    : "Guest data is stored only in this browser. Export before resetting if you want a local record.";

  const actions = document.createElement("div");
  actions.className = "progress-action-row";

  const exportButton = document.createElement("button");
  exportButton.type = "button";
  exportButton.className = "secondary-action compact-action";
  exportButton.textContent = isAccountMode ? "Export account data" : "Export guest data";
  exportButton.addEventListener("click", () => {
    const blob = new Blob([storageManager.exportGuestData()], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = isAccountMode
      ? "ai-training-pathfinder-account-data.json"
      : "ai-training-pathfinder-guest-data.json";
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus(`${isAccountMode ? "Account" : "Guest"} data export prepared by your browser.`, false);
  });

  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.className = "secondary-action compact-action danger-action";
  resetButton.textContent = isAccountMode ? "Reset account data" : "Reset guest data";
  resetButton.addEventListener("click", () => {
    const confirmed = globalThis.confirm(
      `Reset all ${isAccountMode ? "account" : "guest"} assessment, progress, reflection, and achievement data?`
    );

    if (!confirmed) {
      return;
    }

    const result = storageManager.resetGuestData();
    setStatus(result.recoverableError || `${isAccountMode ? "Account" : "Guest"} data reset.`, Boolean(result.recoverableError));
    refreshProgressViews();
    setView("home", { focusMain: true });
  });

  actions.append(exportButton, resetButton);
  section.append(heading, description, actions);
  return section;
}

function renderStorageState() {
  const { state, recoverableError } = storageManager.getSnapshot();
  const startedElement = document.querySelector("#guest-started");
  const modeElement = document.querySelector("#storage-mode");
  const healthElement = document.querySelector("#storage-health");
  const assessmentStatusElement = document.querySelector("#assessment-storage-status");
  const progressStatusElement = document.querySelector("#progress-storage-status");
  const summary = progressSummary();

  modeElement.textContent = state.mode === "account" ? "Account" : "Guest";
  startedElement.textContent = state.guestStartedAt
    ? new Date(state.guestStartedAt).toLocaleString()
    : "Not started";
  healthElement.textContent = recoverableError || "Ready";
  assessmentStatusElement.textContent = state.assessment
    ? `Completed ${new Date(state.assessment.completedAt).toLocaleDateString()}`
    : "Not completed";
  if (progressStatusElement) {
    progressStatusElement.textContent = `${summary.completedCount} completed, ${formatHours(summary.totalMinutes)} recorded`;
  }

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
  provider.textContent = `${item.provider} - ${item.format || "Format not stated"} - ${formatDuration(item.estimatedMinutes, item.durationNote)}`;

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

  card.append(createProgressControls(item.id));

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
    appData.supabaseConfig = configuration.supabase;
    appData.catalog = catalog;
    appData.practiceCards = configuration.appliedPracticeCards;
    appData.milestones = configuration.milestones;
    appData.achievements = configuration.achievements;

    renderDynamicViews();
    renderPathStages(configuration.appConfig.learningPathStages);

    const { state, recoverableError } = storageManager.getSnapshot();
    setView(state.activeView || "home");

    initializeAccountMode({
      config: configuration.supabase,
      root: document.querySelector("#auth-root"),
      milestones: configuration.milestones,
      achievements: configuration.achievements,
      createStorageManager,
      getCurrentState: () => storageManager.getSnapshot().state,
      onStorageManagerChanged: (nextStorageManager) => {
        storageManager = nextStorageManager;
      },
      onStatus: setStatus,
      onRender: renderDynamicViews
    }).catch(() => {
      setStatus("Account mode could not be initialized. Guest mode remains available.", true);
    });

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
