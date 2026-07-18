import { loadCatalog } from "./catalog.js";
import { loadConfiguration } from "./configuration.js";
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

function renderAssessmentSummary(config) {
  const container = document.querySelector("#assessment-config-summary");
  container.replaceChildren(
    createCard(
      "Professional fields",
      "Users will choose one primary field and up to two secondary fields.",
      config.professionalFields.slice(0, 6)
    ),
    createCard(
      "Work patterns",
      "Users will choose up to three work patterns.",
      config.workPatterns
    ),
    createCard(
      "Profile dimensions",
      "The app will calculate practical AI fluency and technical orientation separately.",
      [
        `${config.practicalFluencyLevels.length} fluency levels`,
        `${config.technicalOrientationLevels.length} orientation levels`
      ]
    )
  );
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

  modeElement.textContent = state.mode === "guest" ? "Guest" : state.mode;
  startedElement.textContent = state.guestStartedAt
    ? new Date(state.guestStartedAt).toLocaleString()
    : "Not started";
  healthElement.textContent = recoverableError || "Ready";

  if (recoverableError) {
    setStatus(recoverableError, true);
  }
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
      recoverableError || "Guest mode started. Full assessment content begins in Phase 2.",
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
    renderAssessmentSummary(configuration.appConfig);
    renderPathStages(configuration.appConfig.learningPathStages);
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
