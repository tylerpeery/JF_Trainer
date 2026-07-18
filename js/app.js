import { loadCatalog } from "./catalog.js";
import { loadConfiguration } from "./configuration.js";
import { calculateProfile } from "./assessment.js";
import { createStorageManager } from "./storage/storage-manager.js";

const panels = Array.from(document.querySelectorAll("[data-view-panel]"));
const navButtons = Array.from(document.querySelectorAll(".nav-link"));
const statusPanel = document.querySelector(".status-panel");
const statusText = document.querySelector("#app-status");
const mainContent = document.querySelector("#main-content");
const storageManager = createStorageManager();

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

function createOptionInput({ type, name, value, label, checked = false }) {
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
  text.textContent = label;

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
    optionStack.append(createOptionInput({ type: "checkbox", name, value, label }));
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

function createCompactChoiceGroup({ title, name, options, type = "checkbox" }) {
  const wrapper = document.createElement("div");
  wrapper.className = "choice-subsection";

  const heading = document.createElement("h3");
  heading.textContent = title;
  wrapper.append(heading);

  const optionStack = document.createElement("div");
  optionStack.className = "option-stack";

  options.forEach((option) => {
    const label = typeof option === "string" ? option : option.label;
    const value = typeof option === "string" ? option : option.id;
    optionStack.append(createOptionInput({ type, name, value, label }));
  });

  wrapper.append(optionStack);
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
        label: option.label
      })
    );
  });

  fieldset.dataset.requiredGroup = question.required ? question.id : "";
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
      checkbox.disabled = !checkbox.checked && selectedCount >= max;
    });
  };

  checkboxes.forEach((checkbox) => checkbox.addEventListener("change", update));
  update();
}

function readAssessmentAnswers(form) {
  return {
    primaryField: form.elements.primaryField.value,
    secondaryFields: selectedValues(form, "secondaryFields"),
    workPatterns: selectedValues(form, "workPatterns"),
    genAiFrequency: form.elements.genAiFrequency.value,
    completedActivities: selectedValues(form, "completedActivities"),
    verifyOutput: form.elements.verifyOutput.value,
    promptBreakdown: form.elements.promptBreakdown.value,
    responsibleHandling: form.elements.responsibleHandling.value,
    limitations: form.elements.limitations.value,
    technicalExperience: form.elements.technicalExperience.value,
    aiResponsibilities: selectedValues(form, "aiResponsibilities"),
    learningGoals: selectedValues(form, "learningGoals"),
    weeklyTime: form.elements.weeklyTime.value,
    preferredFormats: selectedValues(form, "preferredFormats")
  };
}

function validateAssessmentAnswers(answers, appConfig) {
  const errors = [];
  const requiredSingleAnswers = [
    ["primaryField", "Choose one primary professional field."],
    ["genAiFrequency", "Answer the recent AI use question."],
    ["verifyOutput", "Answer the output verification question."],
    ["promptBreakdown", "Answer the prompt improvement question."],
    ["responsibleHandling", "Answer the responsible handling question."],
    ["limitations", "Answer the limitations question."],
    ["technicalExperience", "Answer the technical background question."],
    ["weeklyTime", "Choose your weekly available time."]
  ];

  requiredSingleAnswers.forEach(([key, message]) => {
    if (!answers[key]) {
      errors.push(message);
    }
  });

  if (answers.secondaryFields.length > appConfig.selectionRules.secondaryFieldsMaximum) {
    errors.push(`Choose no more than ${appConfig.selectionRules.secondaryFieldsMaximum} secondary fields.`);
  }

  if (answers.workPatterns.length === 0) {
    errors.push("Choose at least one work pattern.");
  }

  if (answers.workPatterns.length > appConfig.selectionRules.workPatternsMaximum) {
    errors.push(`Choose no more than ${appConfig.selectionRules.workPatternsMaximum} work patterns.`);
  }

  if (answers.completedActivities.length === 0) {
    errors.push("Choose at least one completed activity option.");
  }

  if (answers.aiResponsibilities.length === 0) {
    errors.push("Choose at least one AI responsibility option.");
  }

  if (answers.learningGoals.length === 0) {
    errors.push("Choose at least one learning goal.");
  }

  if (answers.preferredFormats.length === 0) {
    errors.push("Choose at least one preferred format.");
  }

  return errors;
}

function renderAssessmentResult(result, accuracyOptions) {
  const resultPanel = document.querySelector("#assessment-result-panel");
  const resultContent = document.querySelector("#assessment-result-content");

  resultContent.replaceChildren(
    createResultCard(
      "Practical AI fluency",
      result.practicalFluency.level.label,
      result.practicalFluency.level.description,
      result.practicalFluency.score
    ),
    createResultCard(
      "Technical orientation",
      result.technicalOrientation.level.label,
      result.technicalOrientation.level.description,
      result.technicalOrientation.score
    )
  );

  renderAccuracyControls(resultPanel, accuracyOptions);
  resultPanel.hidden = false;
  renderPathProfileSummary(result);
  renderStorageState();
}

function createResultCard(title, level, description, score) {
  const card = document.createElement("article");
  card.className = "result-card";

  const heading = document.createElement("h3");
  heading.textContent = title;
  const levelText = document.createElement("strong");
  levelText.textContent = level;
  const descriptionText = document.createElement("p");
  descriptionText.textContent = description || "";
  const scoreText = document.createElement("p");
  scoreText.className = "score";
  scoreText.textContent = `Internal assessment score: ${score}`;

  card.append(heading, levelText, descriptionText, scoreText);
  return card;
}

function renderAccuracyControls(resultPanel, accuracyOptions) {
  const container = resultPanel.querySelector("#accuracy-feedback");
  container.replaceChildren();

  const fieldset = createFieldset("Does this profile seem accurate?");
  const stack = document.createElement("div");
  stack.className = "option-stack";

  accuracyOptions.forEach((option) => {
    stack.append(createOptionInput({ type: "radio", name: "accuracyFeedback", value: option.id, label: option.label }));
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
  errorBox.hidden = true;

  const primaryFieldset = createFieldset("1. Select your primary professional field.");
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
  primaryFieldset.append(primaryLabel, primarySelect);

  form.append(
    primaryFieldset,
    createCheckboxGroup({
      title: "2. Select up to two secondary professional fields.",
      description: "Leave this blank if no secondary field applies.",
      name: "secondaryFields",
      options: appConfig.professionalFields,
      max: appConfig.selectionRules.secondaryFieldsMaximum
    }),
    createCheckboxGroup({
      title: "3. Select up to three work patterns.",
      description: "Choose the kinds of work you do most often.",
      name: "workPatterns",
      options: appConfig.workPatterns,
      required: true,
      max: appConfig.selectionRules.workPatternsMaximum
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

  const preferencesFieldset = createFieldset(
    "12. Select your learning goals, available time, and preferred formats."
  );
  preferencesFieldset.append(
    createCompactChoiceGroup({
      title: "Learning goals",
      name: "learningGoals",
      options: assessmentConfig.learningGoals
    }),
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
    const errors = validateAssessmentAnswers(answers, appConfig);

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
  bindSelectionLimit(form, "secondaryFields", appConfig.selectionRules.secondaryFieldsMaximum);
  bindSelectionLimit(form, "workPatterns", appConfig.selectionRules.workPatternsMaximum);

  const { state } = storageManager.getSnapshot();
  if (state.assessment) {
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

function renderCatalog(catalog) {
  const container = document.querySelector("#catalog-list");
  const cards = catalog.map((resource) => {
    const card = document.createElement("article");
    card.className = "catalog-card";

    const label = document.createElement("span");
    label.className = "sample-label";
    label.textContent = resource.sampleData ? "Unverified sample data" : "Verified resource";

    const heading = document.createElement("h3");
    heading.textContent = resource.title;

    const provider = document.createElement("p");
    provider.textContent = `Provider: ${resource.provider}`;

    const description = document.createElement("p");
    description.textContent = resource.description;

    const evidence = document.createElement("p");
    evidence.textContent = resource.evidenceNote;

    card.append(label, heading, provider, description, evidence);
    return card;
  });

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
        "Complete the assessment to see your profile dimensions here before Phase 3 recommendations are added."
      )
    );
    return;
  }

  container.replaceChildren(
    createResultCard(
      "Practical AI fluency",
      assessment.practicalFluency.level.label,
      assessment.practicalFluency.level.description,
      assessment.practicalFluency.score
    ),
    createResultCard(
      "Technical orientation",
      assessment.technicalOrientation.level.label,
      assessment.technicalOrientation.level.description,
      assessment.technicalOrientation.score
    )
  );
  container.className = "assessment-results";
}

function bindNavigation() {
  function bindKeyboardActivation(button, action) {
    button.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        action();
      }
    });
  }

  navButtons.forEach((button) => {
    const activate = () => {
      setView(button.dataset.view, { focusMain: true });
      renderStorageState();
    };

    button.addEventListener("click", activate);
    bindKeyboardActivation(button, activate);
  });

  document.querySelectorAll("[data-view-target]").forEach((button) => {
    const activate = () => {
      setView(button.dataset.viewTarget, { focusMain: true });
      renderStorageState();
    };

    button.addEventListener("click", activate);
    bindKeyboardActivation(button, activate);
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
  bindKeyboardActivation(guestButton, startGuest);
}

async function init() {
  bindNavigation();

  try {
    const [configuration, catalog] = await Promise.all([loadConfiguration(), loadCatalog()]);
    renderAssessment(configuration.appConfig, configuration.assessment);
    renderPathStages(configuration.appConfig.learningPathStages);
    renderPathProfileSummary();
    renderCatalog(catalog);
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
