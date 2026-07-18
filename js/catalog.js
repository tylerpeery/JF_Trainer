export async function loadCatalog() {
  const response = await fetch(new URL("../data/training-resources.json", import.meta.url));

  if (!response.ok) {
    throw new Error(`Unable to load training catalog: ${response.status}`);
  }

  const catalog = await response.json();

  if (!Array.isArray(catalog)) {
    throw new Error("Training catalog must be a JSON array.");
  }

  return catalog;
}
