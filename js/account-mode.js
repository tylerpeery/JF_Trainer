import {
  getAuthRedirectUrl,
  getPasswordRecoveryRedirectUrl,
  isSupabaseConfigured,
  createSupabaseBrowserClient
} from "./supabase-client.js";
import { createSupabaseAccountAdapter } from "./storage/supabase-account-storage.js";

const MAX_DISPLAY_NAME_LENGTH = 80;
const MIN_PASSWORD_LENGTH = 8;
const PASSWORD_RECOVERY_MODE = "password-recovery";
const PASSWORD_RECOVERY_STORAGE_KEY = "ai-training-pathfinder.passwordRecovery";
const PASSWORD_UPDATED_MESSAGE =
  "Your password has been updated. You can now sign in using your email and new password.";

function renderMessage(root, message, isError = false) {
  const paragraph = document.createElement("p");
  paragraph.className = isError ? "form-errors" : "selection-note";
  paragraph.textContent = message;
  root.replaceChildren(paragraph);
}

function createButton(label, className = "secondary-action compact-action") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  return button;
}

export function sanitizeDisplayName(value = "") {
  return String(value).trim().slice(0, MAX_DISPLAY_NAME_LENGTH);
}

export function displayNameFromUser(user = {}) {
  return sanitizeDisplayName(user?.user_metadata?.display_name || user?.user_metadata?.full_name || "");
}

export function validateSignupInput({ password = "", confirmPassword = "" } = {}) {
  return validateNewPasswordInput({ password, confirmPassword });
}

export function validateNewPasswordInput({ password = "", confirmPassword = "" } = {}) {
  if (!password || !confirmPassword) {
    return "Enter and confirm a password.";
  }

  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  return "";
}

export function hasPasswordRecoveryMarker(location = globalThis.location) {
  try {
    return new URL(location.href).searchParams.get("mode") === PASSWORD_RECOVERY_MODE;
  } catch (error) {
    return false;
  }
}

export function authErrorMessage(error, fallback = "Authentication request could not be completed.") {
  const message = String(error?.message || error?.error_description || error || "").toLowerCase();
  const status = Number(error?.status || 0);

  if (!message && !status) {
    return fallback;
  }

  if (status === 429 || message.includes("too many") || message.includes("rate limit")) {
    return "Too many requests. Wait and try again later.";
  }

  if (
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("load failed")
  ) {
    return "Network request failed. Check your connection and Supabase project availability.";
  }

  if (message.includes("invalid login credentials") || message.includes("invalid credentials")) {
    return "Email or password was not accepted.";
  }

  if (
    message.includes("already registered") ||
    message.includes("already exists") ||
    message.includes("user already")
  ) {
    return "Account could not be created with those details. If you already have an account, sign in instead.";
  }

  if (
    message.includes("weak password") ||
    message.includes("password should") ||
    message.includes("password must") ||
    message.includes("at least 6")
  ) {
    return "Choose a stronger password. Supabase requires a stronger password for this project.";
  }

  if (
    message.includes("expired") ||
    message.includes("session missing") ||
    message.includes("missing session") ||
    message.includes("invalid recovery") ||
    message.includes("invalid reset") ||
    message.includes("otp") ||
    message.includes("token")
  ) {
    return "Your password-reset session has expired. Request a new reset email.";
  }

  if (
    message.includes("signup") && (
      message.includes("disabled") ||
      message.includes("not allowed")
    )
  ) {
    return "Account creation is disabled for this Supabase project.";
  }

  if (
    message.includes("email provider") ||
    message.includes("email logins are disabled") ||
    message.includes("provider is disabled")
  ) {
    return "Email authentication is disabled in Supabase settings.";
  }

  if (
    message.includes("email not confirmed") ||
    message.includes("not confirmed") ||
    message.includes("confirm your email") ||
    message.includes("unconfirmed")
  ) {
    return "This email has not been confirmed yet. Confirmation email delivery must be working before sign-in.";
  }

  return fallback;
}

function rememberPasswordRecovery() {
  try {
    globalThis.sessionStorage?.setItem(PASSWORD_RECOVERY_STORAGE_KEY, String(Date.now()));
  } catch (error) {
    // Session storage is only a recovery-mode hint; the Supabase session is authoritative.
  }
}

function forgetPasswordRecovery() {
  try {
    globalThis.sessionStorage?.removeItem(PASSWORD_RECOVERY_STORAGE_KEY);
  } catch (error) {
    // No action needed when session storage is unavailable.
  }
}

function hasRememberedPasswordRecovery() {
  try {
    return Boolean(globalThis.sessionStorage?.getItem(PASSWORD_RECOVERY_STORAGE_KEY));
  } catch (error) {
    return false;
  }
}

function clearPasswordRecoveryUrlMarker() {
  if (!hasPasswordRecoveryMarker()) {
    return;
  }

  try {
    const url = new URL(globalThis.location.href);
    url.searchParams.delete("mode");
    globalThis.history?.replaceState({}, "", url.toString());
  } catch (error) {
    // URL cleanup is best effort only.
  }
}

function logSafeAuthIssue(context, error) {
  if (!error) {
    return;
  }

  console.warn("Supabase Auth issue", {
    context,
    code: error.code || error.name || null,
    status: error.status || null
  });
}

function createStatusElement() {
  const status = document.createElement("p");
  status.className = "selection-note";
  status.setAttribute("aria-live", "polite");
  return status;
}

function updateStatus(status, message, isError = false) {
  status.textContent = message;
  status.className = isError ? "form-errors" : "selection-note";
}

function createInputField({
  id,
  label,
  type = "text",
  name,
  autocomplete,
  required = true
}) {
  const wrapper = document.createElement("label");
  wrapper.className = "progress-field";
  wrapper.setAttribute("for", id);

  const labelText = document.createElement("span");
  labelText.textContent = label;

  const input = document.createElement("input");
  input.id = id;
  input.name = name || id;
  input.type = type;
  input.required = required;

  if (autocomplete) {
    input.autocomplete = autocomplete;
  }

  wrapper.append(labelText, input);
  return { wrapper, input };
}

function createPasswordField({ id, label, autocomplete }) {
  const wrapper = document.createElement("label");
  wrapper.className = "progress-field";
  wrapper.setAttribute("for", id);

  const labelText = document.createElement("span");
  labelText.textContent = label;

  const inputRow = document.createElement("span");
  inputRow.className = "password-input-row";

  const input = document.createElement("input");
  input.id = id;
  input.name = id;
  input.type = "password";
  input.required = true;
  input.autocomplete = autocomplete;

  const toggle = createButton("Show", "secondary-action compact-action password-toggle");
  toggle.setAttribute("aria-controls", id);
  toggle.setAttribute("aria-pressed", "false");
  toggle.setAttribute("aria-label", `Show ${label.toLowerCase()}`);
  toggle.addEventListener("click", () => {
    const shouldShow = input.type === "password";
    input.type = shouldShow ? "text" : "password";
    toggle.textContent = shouldShow ? "Hide" : "Show";
    toggle.setAttribute("aria-pressed", String(shouldShow));
    toggle.setAttribute("aria-label", `${shouldShow ? "Hide" : "Show"} ${label.toLowerCase()}`);
  });

  inputRow.append(input, toggle);
  wrapper.append(labelText, inputRow);
  return { wrapper, input };
}

function createPilotEmailNote() {
  const note = document.createElement("p");
  note.className = "selection-note";
  note.textContent =
    "Routine password sign-in does not send an authentication email. During the controlled pilot, email confirmation may be disabled because Supabase's default mail service is rate limited. The app will not claim an email address is verified. Password reset, magic links, and email verification require working email delivery.";
  return note;
}

function createPasswordRequirements() {
  const note = document.createElement("p");
  note.className = "selection-note";
  note.textContent = `Password must be at least ${MIN_PASSWORD_LENGTH} characters. Supabase may enforce additional project password rules.`;
  return note;
}

function createModeButton(mode, activeMode, label, onSelect) {
  const button = createButton(
    label,
    mode === activeMode ? "primary-action compact-action" : "secondary-action compact-action"
  );
  button.setAttribute("aria-pressed", String(mode === activeMode));
  button.addEventListener("click", () => onSelect(mode));
  return button;
}

function renderAuthModeButtons(activeMode, onSelect) {
  const group = document.createElement("div");
  group.className = "auth-mode-tabs";
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", "Authentication options");
  group.append(
    createModeButton("signup", activeMode, "Create account", onSelect),
    createModeButton("signin", activeMode, "Sign in", onSelect),
    createModeButton("magic", activeMode, "Optional magic link", onSelect)
  );
  return group;
}

function renderSignupForm({ client, config, onStatus }) {
  const form = document.createElement("form");
  form.className = "auth-panel-body";

  const heading = document.createElement("h3");
  heading.textContent = "Create account with email and password";

  const email = createInputField({
    id: "signup-email",
    label: "Signup email",
    type: "email",
    name: "email",
    autocomplete: "email"
  });
  const password = createPasswordField({
    id: "signup-password",
    label: "New password",
    autocomplete: "new-password"
  });
  const confirmPassword = createPasswordField({
    id: "signup-password-confirm",
    label: "Confirm new password",
    autocomplete: "new-password"
  });

  const submit = createButton("Create account", "primary-action compact-action");
  submit.type = "submit";
  const status = createStatusElement();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const validationMessage = validateSignupInput({
      password: password.input.value,
      confirmPassword: confirmPassword.input.value
    });

    if (validationMessage) {
      updateStatus(status, validationMessage, true);
      onStatus(validationMessage, true);
      return;
    }

    updateStatus(status, "Creating account...");
    let result = null;
    let error = null;

    try {
      result = await client.auth.signUp({
        email: email.input.value.trim(),
        password: password.input.value,
        options: {
          emailRedirectTo: getAuthRedirectUrl(config)
        }
      });
      error = result.error;
    } catch (caughtError) {
      error = caughtError;
    }

    const message = error
      ? authErrorMessage(error)
      : result?.data?.session
        ? "Account created and signed in. Email confirmation may be disabled for this pilot; the app has not verified this email address."
        : "Account created. If confirmation is enabled, check email before signing in. The app has not verified this email address.";
    updateStatus(status, message, Boolean(error));
    onStatus(message, Boolean(error));
  });

  form.append(heading, email.wrapper, password.wrapper, confirmPassword.wrapper, createPasswordRequirements(), submit, status);
  return form;
}

function renderSigninForm({ client, config, onStatus }) {
  const form = document.createElement("form");
  form.className = "auth-panel-body";

  const heading = document.createElement("h3");
  heading.textContent = "Sign in with email and password";

  const email = createInputField({
    id: "login-email",
    label: "Login email",
    type: "email",
    name: "email",
    autocomplete: "email"
  });
  const password = createPasswordField({
    id: "login-password",
    label: "Login password",
    autocomplete: "current-password"
  });

  const submit = createButton("Sign in", "primary-action compact-action");
  submit.type = "submit";
  const resetButton = createButton("Send password reset email");
  const actions = document.createElement("div");
  actions.className = "auth-inline-actions";
  actions.append(submit, resetButton);

  const resetNote = document.createElement("p");
  resetNote.className = "selection-note";
  resetNote.textContent =
    "Password reset preparation uses Supabase Auth and requires working email delivery. It does not reveal whether an arbitrary email address exists beyond Supabase's returned behavior.";

  const status = createStatusElement();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    updateStatus(status, "Signing in...");
    let error = null;

    try {
      ({ error } = await client.auth.signInWithPassword({
        email: email.input.value.trim(),
        password: password.input.value
      }));
    } catch (caughtError) {
      error = caughtError;
    }

    const message = error
      ? authErrorMessage(error)
      : "Signed in. Guest data is unchanged unless you choose Import guest data.";
    updateStatus(status, message, Boolean(error));
    onStatus(message, Boolean(error));
  });

  resetButton.addEventListener("click", async () => {
    const resetEmail = email.input.value.trim();
    if (!resetEmail) {
      const message = "Enter your login email before requesting a password reset.";
      updateStatus(status, message, true);
      onStatus(message, true);
      return;
    }

    updateStatus(status, "Preparing password reset email...");
    let error = null;

    try {
      ({ error } = await client.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: getPasswordRecoveryRedirectUrl(config)
      }));
    } catch (caughtError) {
      error = caughtError;
    }

    const message = error
      ? authErrorMessage(error)
      : "If password reset is available for that account, Supabase will send reset instructions. Email delivery must be configured.";
    updateStatus(status, message, Boolean(error));
    onStatus(message, Boolean(error));
  });

  form.append(heading, email.wrapper, password.wrapper, resetNote, actions, status);
  return form;
}

function renderMagicLinkForm({ client, config, onStatus }) {
  const form = document.createElement("form");
  form.className = "auth-panel-body";

  const heading = document.createElement("h3");
  heading.textContent = "Optional magic link";

  const email = createInputField({
    id: "magic-link-email",
    label: "Email for optional magic link",
    type: "email",
    name: "email",
    autocomplete: "email"
  });

  const note = document.createElement("p");
  note.className = "selection-note";
  note.textContent =
    "Magic links are optional and subject to email delivery availability and Supabase mail rate limits.";

  const submit = createButton("Send magic link", "primary-action compact-action");
  submit.type = "submit";
  const status = createStatusElement();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    updateStatus(status, "Sending magic link...");
    let error = null;

    try {
      ({ error } = await client.auth.signInWithOtp({
        email: email.input.value.trim(),
        options: {
          emailRedirectTo: getAuthRedirectUrl(config)
        }
      }));
    } catch (caughtError) {
      error = caughtError;
    }

    const message = error
      ? authErrorMessage(error, "Magic link could not be sent. Check Supabase auth and email settings.")
      : "If magic link sign-in is available, Supabase will send a link. The app has not verified this email address.";
    updateStatus(status, message, Boolean(error));
    onStatus(message, Boolean(error));
  });

  form.append(heading, email.wrapper, note, submit, status);
  return form;
}

function renderSignedOutAuthPanel({ client, config, onStatus }) {
  let activeMode = "signin";
  const wrapper = document.createElement("div");
  wrapper.className = "auth-form";

  function renderMode(mode = activeMode) {
    activeMode = mode;
    const body = activeMode === "signup"
      ? renderSignupForm({ client, config, onStatus })
      : activeMode === "magic"
        ? renderMagicLinkForm({ client, config, onStatus })
        : renderSigninForm({ client, config, onStatus });

    wrapper.replaceChildren(
      renderAuthModeButtons(activeMode, renderMode),
      createPilotEmailNote(),
      body
    );
  }

  renderMode();
  return wrapper;
}

function renderPasswordUpdateForm({
  client,
  headingText = "Choose a new password",
  introText = "",
  submitLabel = "Update password",
  cancelLabel = "Cancel and sign out",
  onStatus,
  onSuccess,
  onCancel
}) {
  const form = document.createElement("form");
  form.className = "password-recovery-form";

  const heading = document.createElement("h3");
  heading.textContent = headingText;

  const intro = document.createElement("p");
  intro.className = "selection-note";
  intro.textContent = introText || "Enter a new password for this Supabase account.";

  const password = createPasswordField({
    id: `${headingText.toLowerCase().replaceAll(" ", "-")}-password`,
    label: "New password",
    autocomplete: "new-password"
  });
  const confirmPassword = createPasswordField({
    id: `${headingText.toLowerCase().replaceAll(" ", "-")}-password-confirm`,
    label: "Confirm new password",
    autocomplete: "new-password"
  });

  const submit = createButton(submitLabel, "primary-action compact-action");
  submit.type = "submit";
  const cancel = createButton(cancelLabel);
  const actions = document.createElement("div");
  actions.className = "auth-inline-actions";
  actions.append(submit, cancel);
  const status = createStatusElement();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const validationMessage = validateNewPasswordInput({
      password: password.input.value,
      confirmPassword: confirmPassword.input.value
    });

    if (validationMessage) {
      updateStatus(status, validationMessage, true);
      onStatus(validationMessage, true);
      return;
    }

    updateStatus(status, "Updating password...");
    let result = null;
    let error = null;

    try {
      result = await client.auth.updateUser({
        password: password.input.value
      });
      error = result.error;
    } catch (caughtError) {
      error = caughtError;
    }

    password.input.value = "";
    confirmPassword.input.value = "";

    if (error) {
      logSafeAuthIssue("password-update", error);
      const message = authErrorMessage(error, "Password could not be updated. Request a new reset email if this link has expired.");
      updateStatus(status, message, true);
      onStatus(message, true);
      return;
    }

    updateStatus(status, PASSWORD_UPDATED_MESSAGE);
    onStatus(PASSWORD_UPDATED_MESSAGE, false);
    onSuccess?.(result?.data?.user || null);
  });

  cancel.addEventListener("click", () => {
    password.input.value = "";
    confirmPassword.input.value = "";
    onCancel?.();
  });

  form.append(heading, intro, password.wrapper, confirmPassword.wrapper, createPasswordRequirements(), actions, status);
  return form;
}

function renderDisplayNameForm({ client, user, onStatus, onUserUpdated }) {
  const form = document.createElement("form");
  form.className = "display-name-form";

  const field = createInputField({
    id: "account-display-name",
    label: "Display name",
    name: "displayName",
    autocomplete: "name",
    required: false
  });
  field.input.value = displayNameFromUser(user);
  field.input.maxLength = MAX_DISPLAY_NAME_LENGTH;

  const note = document.createElement("p");
  note.className = "selection-note";
  note.textContent = "Optional display name is shown only in this app experience. It is not your login identifier.";

  const submit = createButton("Save display name", "secondary-action compact-action");
  submit.type = "submit";
  const status = createStatusElement();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    updateStatus(status, "Saving display name...");
    let result = null;
    let error = null;

    try {
      result = await client.auth.updateUser({
        data: {
          display_name: sanitizeDisplayName(field.input.value)
        }
      });
      error = result.error;
    } catch (caughtError) {
      error = caughtError;
    }

    const message = error
      ? authErrorMessage(error, "Display name could not be saved.")
      : "Display name saved. It does not change your login email.";
    updateStatus(status, message, Boolean(error));
    onStatus(message, Boolean(error));

    if (!error && result?.data?.user) {
      onUserUpdated(result.data.user);
    }
  });

  form.append(field.wrapper, note, submit, status);
  return form;
}

export async function initializeAccountMode({
  config,
  root,
  milestones = [],
  achievements = [],
  createStorageManager,
  getCurrentState,
  onStorageManagerChanged,
  onStatus,
  onRender
}) {
  if (!root) {
    return null;
  }

  if (!isSupabaseConfigured(config)) {
    renderMessage(
      root,
      "Account mode is not configured. Guest mode remains available until a Supabase URL and publishable key are added."
    );
    return null;
  }

  let client = null;
  let accountActive = false;
  let activeUserId = null;
  let activeAccountStorageManager = null;
  let passwordRecoveryActive = false;

  try {
    client = await createSupabaseBrowserClient(config);
  } catch (error) {
    renderMessage(root, "Supabase client setup failed. Guest mode remains available.", true);
    return null;
  }

  async function activateAccountStorage(user) {
    if (passwordRecoveryActive) {
      return;
    }

    if (accountActive && activeUserId === user.id) {
      return;
    }

    activeUserId = user.id;
    const adapter = createSupabaseAccountAdapter({
      client,
      user,
      initialState: getCurrentState()
    });
    const { recoverableError } = await adapter.loadRemoteState();
    accountActive = true;
    activeAccountStorageManager = createStorageManager(adapter);
    onStorageManagerChanged(activeAccountStorageManager);
    onRender();
    onStatus(
      recoverableError || "Account mode is active. Progress will save to your Supabase account.",
      Boolean(recoverableError)
    );
    renderSignedIn(user);
  }

  function renderSignedOut() {
    if (accountActive) {
      accountActive = false;
      activeUserId = null;
      activeAccountStorageManager = null;
      onStorageManagerChanged(createStorageManager());
      onRender();
    }

    root.replaceChildren(renderSignedOutAuthPanel({ client, config, onStatus }));
  }

  async function signOutFromRecovery(message = "Password recovery canceled. Guest mode is still available.") {
    let error = null;

    try {
      ({ error } = await client.auth.signOut());
    } catch (caughtError) {
      error = caughtError;
    }

    forgetPasswordRecovery();
    clearPasswordRecoveryUrlMarker();
    passwordRecoveryActive = false;

    if (error) {
      logSafeAuthIssue("password-recovery-signout", error);
      onStatus(authErrorMessage(error, "Sign out failed. Please try again."), true);
      return;
    }

    onStatus(message, false);
    renderSignedOut();
  }

  function renderPasswordRecoverySuccess() {
    const wrapper = document.createElement("div");
    wrapper.className = "auth-session password-recovery-panel";

    const heading = document.createElement("h3");
    heading.textContent = "Password updated";

    const message = document.createElement("p");
    message.className = "selection-note";
    message.textContent = PASSWORD_UPDATED_MESSAGE;

    const signOut = createButton("Sign out and test password sign-in", "primary-action compact-action");
    signOut.addEventListener("click", () => {
      signOutFromRecovery("Signed out. Sign in with your email and new password to test the change.");
    });

    wrapper.append(heading, message, signOut);
    root.replaceChildren(wrapper);
  }

  function renderPasswordRecovery(session = null) {
    passwordRecoveryActive = true;
    rememberPasswordRecovery();

    if (!session?.user) {
      const wrapper = document.createElement("div");
      wrapper.className = "auth-session password-recovery-panel";

      const heading = document.createElement("h3");
      heading.textContent = "Password reset link expired";

      const message = document.createElement("p");
      message.className = "form-errors";
      message.textContent = "Your password-reset session has expired. Request a new reset email.";

      const returnButton = createButton("Return to sign in", "primary-action compact-action");
      returnButton.addEventListener("click", () => {
        forgetPasswordRecovery();
        clearPasswordRecoveryUrlMarker();
        passwordRecoveryActive = false;
        renderSignedOut();
      });

      wrapper.append(heading, message, returnButton);
      root.replaceChildren(wrapper);
      onStatus(message.textContent, true);
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "auth-session password-recovery-panel";
    const recoveryForm = renderPasswordUpdateForm({
      client,
      headingText: "Choose a new password",
      introText:
        "You are in password-recovery mode. Update your password before continuing to ordinary account setup.",
      submitLabel: "Update password",
      cancelLabel: "Cancel and sign out",
      onStatus,
      onSuccess: renderPasswordRecoverySuccess,
      onCancel: () => {
        signOutFromRecovery();
      }
    });

    wrapper.append(recoveryForm);
    root.replaceChildren(wrapper);
  }

  function renderSignedIn(user) {
    if (passwordRecoveryActive) {
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "auth-session";

    const status = document.createElement("p");
    status.className = "selection-note";
    const displayName = displayNameFromUser(user);
    status.textContent = displayName
      ? `Signed in as ${displayName}. Account storage is active for this browser session.`
      : "Signed in. Account storage is active for this browser session.";

    const displayNameForm = renderDisplayNameForm({
      client,
      user,
      onStatus,
      onUserUpdated: renderSignedIn
    });

    const accountSettings = document.createElement("details");
    accountSettings.className = "account-settings";
    const accountSettingsSummary = document.createElement("summary");
    accountSettingsSummary.textContent = "Account settings";
    const accountPasswordForm = renderPasswordUpdateForm({
      client,
      headingText: "Change account password",
      introText:
        "Set or change the password for this Supabase account. This is useful if the account originally used magic-link sign-in.",
      submitLabel: "Save password",
      cancelLabel: "Cancel",
      onStatus,
      onSuccess: () => {},
      onCancel: () => {
        accountSettings.open = false;
        onStatus("Password change canceled.", false);
      }
    });
    accountSettings.append(accountSettingsSummary, accountPasswordForm);

    const signOut = createButton("Sign out");
    signOut.addEventListener("click", async () => {
      let error = null;

      try {
        ({ error } = await client.auth.signOut());
      } catch (caughtError) {
        error = caughtError;
      }

      if (error) {
        onStatus(authErrorMessage(error, "Sign out failed. Please try again."), true);
        return;
      }

      onStatus("Signed out. Guest mode is still available.", false);
    });

    const importButton = createButton("Import guest data");
    const guestSnapshot = createStorageManager().getSnapshot();
    const hasGuestData = activeAccountStorageManager?.hasTransferableGuestState(guestSnapshot.state);
    importButton.disabled = !hasGuestData;
    importButton.addEventListener("click", async () => {
      if (!activeAccountStorageManager) {
        onStatus("Account storage is still loading. Try again in a moment.", true);
        return;
      }

      const currentGuestSnapshot = createStorageManager().getSnapshot();
      if (!activeAccountStorageManager.hasTransferableGuestState(currentGuestSnapshot.state)) {
        onStatus("No guest assessment, progress, reflection, or achievement data is available to import.", false);
        renderSignedIn(user);
        return;
      }

      const { recoverableError } = activeAccountStorageManager.importGuestState(
        currentGuestSnapshot.state,
        milestones,
        achievements
      );
      await activeAccountStorageManager.flush();

      onRender();
      renderSignedIn(user);
      onStatus(
        recoverableError || "Guest data imported into this account. Duplicate records were merged by stable IDs.",
        Boolean(recoverableError)
      );
    });

    const importNote = document.createElement("p");
    importNote.className = "selection-note";
    importNote.textContent = hasGuestData
      ? "Guest import merges assessment, progress, reflections, and achievements into this account without duplicate credit."
      : "No guest data is available in this browser to import.";

    wrapper.append(status, displayNameForm, accountSettings, importButton, importNote, signOut);
    root.replaceChildren(wrapper);
    activateAccountStorage(user).catch(() => {
      renderMessage(root, "Account data could not be loaded. Guest mode remains available.", true);
      accountActive = false;
      activeUserId = null;
      activeAccountStorageManager = null;
      onStorageManagerChanged(createStorageManager());
      onRender();
      onStatus("Account data could not be loaded. Guest mode remains available.", true);
    });
  }

  client.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") {
      renderPasswordRecovery(session);
      return;
    }

    if (passwordRecoveryActive && event !== "SIGNED_OUT") {
      return;
    }

    if (session?.user) {
      renderSignedIn(session.user);
    } else {
      forgetPasswordRecovery();
      clearPasswordRecoveryUrlMarker();
      passwordRecoveryActive = false;
      renderSignedOut();
    }
  });

  const shouldEnterPasswordRecovery = hasPasswordRecoveryMarker() || hasRememberedPasswordRecovery();
  const { data, error } = await client.auth.getSession();

  if (error) {
    renderMessage(root, "Supabase session could not be checked. Guest mode remains available.", true);
    return null;
  }

  const session = data?.session || null;
  if (shouldEnterPasswordRecovery) {
    renderPasswordRecovery(session);
    return {
      client
    };
  }

  const user = session?.user || null;
  if (user) {
    renderSignedIn(user);
  } else {
    renderSignedOut();
  }

  return {
    client
  };
}
