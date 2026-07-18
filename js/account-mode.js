import { getAuthRedirectUrl, isSupabaseConfigured, createSupabaseBrowserClient } from "./supabase-client.js";
import { createSupabaseAccountAdapter } from "./storage/supabase-account-storage.js";

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

  try {
    client = await createSupabaseBrowserClient(config);
  } catch (error) {
    renderMessage(root, "Supabase client setup failed. Guest mode remains available.", true);
    return null;
  }

  async function activateAccountStorage(user) {
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

    const form = document.createElement("form");
    form.className = "auth-form";

    const label = document.createElement("label");
    label.className = "progress-field";
    label.setAttribute("for", "auth-email");

    const labelText = document.createElement("span");
    labelText.textContent = "Email for account sign-in";
    const input = document.createElement("input");
    input.id = "auth-email";
    input.name = "email";
    input.type = "email";
    input.autocomplete = "email";
    input.required = true;

    label.append(labelText, input);

    const note = document.createElement("p");
    note.className = "selection-note";
    note.textContent = "Supabase sends a sign-in link to this email. Do not enter sensitive information elsewhere in the app.";

    const submit = createButton("Send sign-in link", "primary-action compact-action");
    submit.type = "submit";
    const status = document.createElement("p");
    status.className = "selection-note";
    status.setAttribute("aria-live", "polite");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      status.textContent = "Sending sign-in link...";
      let error = null;

      try {
        ({ error } = await client.auth.signInWithOtp({
          email: input.value.trim(),
          options: {
            emailRedirectTo: getAuthRedirectUrl(config)
          }
        }));
      } catch (caughtError) {
        error = caughtError;
      }

      status.textContent = error
        ? "Sign-in link could not be sent. Check the Supabase auth settings."
        : "Check your email for the sign-in link.";
      onStatus(status.textContent, Boolean(error));
    });

    form.append(label, note, submit, status);
    root.replaceChildren(form);
  }

  function renderSignedIn(user) {
    const wrapper = document.createElement("div");
    wrapper.className = "auth-session";

    const status = document.createElement("p");
    status.className = "selection-note";
    status.textContent = "Signed in. Account storage is active for this browser session.";

    const signOut = createButton("Sign out");
    signOut.addEventListener("click", async () => {
      let error = null;

      try {
        ({ error } = await client.auth.signOut());
      } catch (caughtError) {
        error = caughtError;
      }

      if (error) {
        onStatus("Sign out failed. Please try again.", true);
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

    wrapper.append(status, importButton, importNote, signOut);
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

  const { data, error } = await client.auth.getSession();

  if (error) {
    renderMessage(root, "Supabase session could not be checked. Guest mode remains available.", true);
    return null;
  }

  const user = data?.session?.user || null;
  if (user) {
    renderSignedIn(user);
  } else {
    renderSignedOut();
  }

  client.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      renderSignedIn(session.user);
    } else {
      renderSignedOut();
    }
  });

  return {
    client
  };
}
