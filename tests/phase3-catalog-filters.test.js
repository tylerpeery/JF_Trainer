import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  browsableCatalogItems,
  catalogFilterOptions,
  countActiveFilters,
  createDefaultCatalogFilters,
  filterCatalogItems,
  sortCatalogItems
} from "../js/catalog-filters.js";

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
}

test("catalog filter options expose configured levels, stages, fields, work patterns, and tags", async () => {
  const appConfig = await readJson("../data/app-config.json");
  const catalog = await readJson("../data/training-resources.json");
  const practiceCards = await readJson("../data/applied-practice-cards.json");
  const options = catalogFilterOptions(browsableCatalogItems(catalog, practiceCards), appConfig);

  assert.deepEqual(
    options.practicalFluency.map((option) => option.label),
    ["New to AI", "Foundational user", "Applied user", "Advanced practitioner"]
  );
  assert.deepEqual(
    options.technicalOrientation.map((option) => option.label),
    ["General user", "Productivity and low-code user", "Developer or data practitioner", "AI/ML builder"]
  );
  assert.deepEqual(
    options.pathStage.map((option) => option.label),
    [
      "AI foundation",
      "Responsible use and output evaluation",
      "Role-aligned application",
      "Hands-on practice",
      "Optional deeper learning"
    ]
  );
  assert.ok(options.professionalField.some((option) => option.label === "Maintenance and logistics"));
  assert.equal(options.professionalField.some((option) => option.label === "Other"), false);
  assert.ok(options.workPattern.some((option) => option.id === "sustain-optimize"));
  assert.ok(options.tags.some((option) => option.id === "governance"));
});

test("catalog filters match categories, tags, aptitude levels, fields, and work patterns", () => {
  const items = [
    {
      id: "all-fields-foundation",
      professionalFields: ["All fields"],
      workPatterns: ["analyze-information"],
      practicalFluencyLevels: ["new-to-ai"],
      technicalOrientations: ["general-user"],
      pathStage: "AI foundation",
      provider: "Elements of AI",
      format: "Reading",
      estimatedMinutes: 45,
      certificateAvailability: "Optional paid electronic certificate is available after successful completion.",
      accessClassification: "free-course-optional-paid-certificate",
      tags: ["ai-foundation", "verification"],
      description: "Introductory AI concepts for verification."
    },
    {
      id: "maintenance-workflow",
      title: "Maintenance workflow lab",
      professionalFields: ["Maintenance and logistics"],
      workPatterns: ["sustain-optimize"],
      practicalFluencyLevels: ["applied-user"],
      technicalOrientations: ["productivity-low-code"],
      pathStage: "Role-aligned application",
      provider: "AI Training Pathfinder",
      format: "Hands-on exercise or lab",
      estimatedMinutes: 25,
      certificateAvailability: "No certificate claim is made.",
      accessClassification: "fully-free",
      tags: ["workflow", "maintenance"],
      description: "A nonsensitive troubleshooting workflow exercise."
    },
    {
      id: "healthcare-governance",
      title: "Healthcare governance reading",
      professionalFields: ["Healthcare"],
      workPatterns: ["lead-govern"],
      practicalFluencyLevels: ["foundational-user"],
      technicalOrientations: ["general-user"],
      pathStage: "Responsible use and output evaluation",
      provider: "Microsoft Learn",
      format: "Reading",
      estimatedMinutes: 145,
      certificateAvailability: "No certificate claim is made from the verified page.",
      accessClassification: "fully-free",
      tags: ["healthcare", "governance"],
      description: "Healthcare AI governance and review."
    }
  ];

  assert.deepEqual(
    filterCatalogItems(items, {
      ...createDefaultCatalogFilters(),
      professionalField: ["Maintenance and logistics"]
    }).map((item) => item.id),
    ["all-fields-foundation", "maintenance-workflow"]
  );
  assert.deepEqual(
    filterCatalogItems(items, {
      ...createDefaultCatalogFilters(),
      professionalField: ["Operations and mission planning"]
    }).map((item) => item.id),
    ["all-fields-foundation"]
  );
  assert.deepEqual(
    filterCatalogItems(items, {
      ...createDefaultCatalogFilters(),
      workPattern: ["sustain-optimize"],
      pathStage: ["Role-aligned application"],
      practicalFluency: ["applied-user"],
      technicalOrientation: ["productivity-low-code"]
    }).map((item) => item.id),
    ["maintenance-workflow"]
  );
  assert.deepEqual(
    filterCatalogItems(items, {
      ...createDefaultCatalogFilters(),
      tags: ["governance"]
    }).map((item) => item.id),
    ["healthcare-governance"]
  );
  assert.deepEqual(
    filterCatalogItems(items, {
      ...createDefaultCatalogFilters(),
      search: "troubleshooting",
      provider: ["AI Training Pathfinder"],
      duration: ["under-30"],
      certificate: ["no-certificate-claim"],
      access: ["fully-free"]
    }).map((item) => item.id),
    ["maintenance-workflow"]
  );
  assert.deepEqual(
    filterCatalogItems(
      items,
      {
        ...createDefaultCatalogFilters(),
        completion: ["completed"]
      },
      {
        "healthcare-governance": { id: "healthcare-governance", status: "completed" }
      }
    ).map((item) => item.id),
    ["healthcare-governance"]
  );
});

test("catalog filter count totals selected values across groups", () => {
  assert.equal(
    countActiveFilters({
      ...createDefaultCatalogFilters(),
      search: "governance",
      tags: ["governance", "verification"],
      pathStage: ["AI foundation"],
      workPattern: ["lead-govern"]
    }),
    5
  );
});

test("catalog sorting supports title, provider, and shortest duration", () => {
  const items = [
    { title: "Zulu", provider: "Provider B", estimatedMinutes: 90 },
    { title: "Alpha", provider: "Provider C", estimatedMinutes: 45 },
    { title: "Middle", provider: "Provider A", estimatedMinutes: null }
  ];

  assert.deepEqual(sortCatalogItems(items).map((item) => item.title), ["Alpha", "Middle", "Zulu"]);
  assert.deepEqual(sortCatalogItems(items, "provider").map((item) => item.provider), ["Provider A", "Provider B", "Provider C"]);
  assert.deepEqual(sortCatalogItems(items, "duration").map((item) => item.title), ["Alpha", "Zulu", "Middle"]);
});
