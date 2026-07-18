import test from "node:test";
import assert from "node:assert/strict";

import {
  authErrorMessage,
  displayNameFromUser,
  hasPasswordRecoveryMarker,
  sanitizeDisplayName,
  validateNewPasswordInput,
  validateSignupInput
} from "../js/account-mode.js";
import { getAuthRedirectUrl, getPasswordRecoveryRedirectUrl } from "../js/supabase-client.js";

test("signup validation requires matching password confirmation", () => {
  assert.equal(
    validateSignupInput({ password: "phase5Password!", confirmPassword: "" }),
    "Enter and confirm a password."
  );
  assert.equal(
    validateSignupInput({ password: "phase5Password!", confirmPassword: "different" }),
    "Passwords do not match."
  );
  assert.equal(
    validateSignupInput({ password: "short", confirmPassword: "short" }),
    "Password must be at least 8 characters."
  );
  assert.equal(
    validateSignupInput({ password: "phase5Password!", confirmPassword: "phase5Password!" }),
    ""
  );
});

test("password update validation rejects missing, mismatched, and short passwords locally", () => {
  assert.equal(
    validateNewPasswordInput({ password: "", confirmPassword: "" }),
    "Enter and confirm a password."
  );
  assert.equal(
    validateNewPasswordInput({ password: "longEnough", confirmPassword: "different" }),
    "Passwords do not match."
  );
  assert.equal(
    validateNewPasswordInput({ password: "short", confirmPassword: "short" }),
    "Password must be at least 8 characters."
  );
  assert.equal(
    validateNewPasswordInput({ password: "longEnough", confirmPassword: "longEnough" }),
    ""
  );
});

test("display name is optional profile metadata, not a login identifier", () => {
  assert.equal(displayNameFromUser({ user_metadata: { display_name: " Pilot Tester " } }), "Pilot Tester");
  assert.equal(displayNameFromUser({ user_metadata: { full_name: "Backup Name" } }), "Backup Name");
  assert.equal(displayNameFromUser({ email: "person@example.test" }), "");
});

test("display name sanitizing trims and limits stored metadata", () => {
  const longName = `  ${"A".repeat(100)}  `;
  assert.equal(sanitizeDisplayName(longName), "A".repeat(80));
});

test("auth redirect remains compatible with a GitHub Pages repository subpath", () => {
  const redirect = getAuthRedirectUrl(
    { authRedirectPath: "./" },
    { href: "https://tylerpeery.github.io/JF_Trainer/index.html" }
  );

  assert.equal(redirect, "https://tylerpeery.github.io/JF_Trainer/");
});

test("password recovery redirect adds a GitHub Pages-safe recovery marker", () => {
  const redirect = getPasswordRecoveryRedirectUrl(
    { authRedirectPath: "./" },
    { href: "https://tylerpeery.github.io/JF_Trainer/index.html" }
  );

  assert.equal(redirect, "https://tylerpeery.github.io/JF_Trainer/?mode=password-recovery");
  assert.equal(hasPasswordRecoveryMarker({ href: redirect }), true);
  assert.equal(hasPasswordRecoveryMarker({ href: "https://tylerpeery.github.io/JF_Trainer/" }), false);
});

test("Supabase Auth error messages cover password and email-delivery cases", () => {
  assert.equal(
    authErrorMessage({ message: "Invalid login credentials" }),
    "Email or password was not accepted."
  );
  assert.equal(
    authErrorMessage({ message: "User already registered" }),
    "Account could not be created with those details. If you already have an account, sign in instead."
  );
  assert.equal(
    authErrorMessage({ message: "Weak password" }),
    "Choose a stronger password. Supabase requires a stronger password for this project."
  );
  assert.equal(
    authErrorMessage({ message: "Auth session missing!" }),
    "Your password-reset session has expired. Request a new reset email."
  );
  assert.equal(
    authErrorMessage({ message: "Token has expired or is invalid" }),
    "Your password-reset session has expired. Request a new reset email."
  );
  assert.equal(
    authErrorMessage({ message: "Signups not allowed for this instance" }),
    "Account creation is disabled for this Supabase project."
  );
  assert.equal(
    authErrorMessage({ message: "Email provider is disabled" }),
    "Email authentication is disabled in Supabase settings."
  );
  assert.equal(
    authErrorMessage({ status: 429, message: "Too many requests" }),
    "Too many requests. Wait and try again later."
  );
  assert.equal(
    authErrorMessage({ message: "Failed to fetch" }),
    "Network request failed. Check your connection and Supabase project availability."
  );
  assert.equal(
    authErrorMessage({ message: "Email not confirmed" }),
    "This email has not been confirmed yet. Confirmation email delivery must be working before sign-in."
  );
});
