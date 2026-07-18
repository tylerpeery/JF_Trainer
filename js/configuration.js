const CONFIG_FILES = {
  appConfig: "../data/app-config.json",
  assessment: "../data/assessment-questions.json",
  recommendation: "../data/recommendation-config.json",
  appliedPracticeCards: "../data/applied-practice-cards.json",
  milestones: "../data/milestones.json",
  achievements: "../data/achievements.json",
  supabase: "../data/supabase-config.json"
};

async function fetchJson(path) {
  const response = await fetch(new URL(path, import.meta.url));

  if (!response.ok) {
    throw new Error(`Unable to load ${path}: ${response.status}`);
  }

  return response.json();
}

export async function loadConfiguration() {
  const entries = await Promise.all(
    Object.entries(CONFIG_FILES).map(async ([key, path]) => [key, await fetchJson(path)])
  );

  return Object.fromEntries(entries);
}
