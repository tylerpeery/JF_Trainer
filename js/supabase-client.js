const DEFAULT_AUTH_REDIRECT_PATH = "./";

export function isSupabaseConfigured(config = {}) {
  const browserSafeKey = config.supabasePublishableKey || config.supabaseAnonKey;

  return Boolean(
    config.enabled === true &&
    typeof config.supabaseUrl === "string" &&
    config.supabaseUrl.startsWith("https://") &&
    typeof browserSafeKey === "string" &&
    browserSafeKey.length > 20
  );
}

export function getAuthRedirectUrl(config = {}, location = globalThis.location) {
  const path = typeof config.authRedirectPath === "string" && config.authRedirectPath
    ? config.authRedirectPath
    : DEFAULT_AUTH_REDIRECT_PATH;

  return new URL(path, location.href).toString();
}

export async function createSupabaseBrowserClient(config = {}) {
  if (!isSupabaseConfigured(config)) {
    return null;
  }

  const sdkUrl = typeof config.sdkUrl === "string" && config.sdkUrl
    ? config.sdkUrl
    : "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
  const browserSafeKey = config.supabasePublishableKey || config.supabaseAnonKey;
  const { createClient } = await import(sdkUrl);

  return createClient(config.supabaseUrl, browserSafeKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      persistSession: true
    }
  });
}
