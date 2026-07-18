function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeText(value = "") {
  return String(value).toLowerCase().trim();
}

function uniqueSorted(values) {
  return Array.from(new Set(values.filter(Boolean))).sort((left, right) => left.localeCompare(right));
}

function optionFromString(value) {
  return {
    id: value,
    label: value
  };
}

function optionFromConfig(value) {
  if (typeof value === "string") {
    return optionFromString(value);
  }

  return {
    id: value.id,
    label: value.label || value.id
  };
}

function hasAnySelected(selectedValues, itemValues) {
  const itemSet = new Set(asArray(itemValues));
  return asArray(selectedValues).some((value) => itemSet.has(value));
}

function matchesProfessionalField(selectedFields, itemFields) {
  if (asArray(selectedFields).length === 0) {
    return true;
  }

  return asArray(itemFields).includes("All fields") || hasAnySelected(selectedFields, itemFields);
}

function matchesFilterGroup(selectedValues, itemValues) {
  return asArray(selectedValues).length === 0 || hasAnySelected(selectedValues, itemValues);
}

function searchableText(item) {
  return normalizeText([
    item.title,
    item.provider,
    item.description,
    ...asArray(item.tags)
  ].join(" "));
}

function matchesSearch(item, search) {
  const query = normalizeText(search);
  return !query || searchableText(item).includes(query);
}

function progressStatus(item, progressRecords = {}) {
  const record = progressRecords[item.id];

  if (record?.status === "completed") {
    return "completed";
  }

  if (record?.status === "started") {
    return "started";
  }

  return "not-started";
}

function durationBucket(item) {
  if (typeof item.estimatedMinutes !== "number") {
    return "duration-not-stated";
  }

  if (item.estimatedMinutes < 30) {
    return "under-30";
  }

  if (item.estimatedMinutes < 60) {
    return "under-60";
  }

  if (item.estimatedMinutes <= 120) {
    return "one-to-two-hours";
  }

  return "over-two-hours";
}

function certificateBucket(item) {
  const text = normalizeText(item.certificateAvailability);

  if (!text) {
    return null;
  }

  if (text.includes("not verified")) {
    return "certificate-not-verified";
  }

  if (text.includes("optional paid")) {
    return "optional-paid-certificate";
  }

  if (
    text.includes("badge") ||
    text.includes("achievement") ||
    text.includes("profile") ||
    text.includes("code")
  ) {
    return "certificate-or-badge-available";
  }

  if (text.includes("no certificate") || text.includes("no paid certificate")) {
    return "no-certificate-claim";
  }

  return null;
}

function accessBucket(item) {
  return item.accessClassification || null;
}

function countOptions(items, options, valueForItem) {
  return options.map((option) => ({
    ...option,
    count: asArray(items).filter((item) => asArray(valueForItem(item)).includes(option.id)).length
  }));
}

function fixedOptions(idsToLabels) {
  return Object.entries(idsToLabels).map(([id, label]) => ({ id, label }));
}

export function createDefaultCatalogFilters() {
  return {
    search: "",
    sort: "title-asc",
    practicalFluency: [],
    technicalOrientation: [],
    pathStage: [],
    provider: [],
    format: [],
    duration: [],
    certificate: [],
    access: [],
    completion: [],
    tags: [],
    professionalField: [],
    workPattern: []
  };
}

export function browsableCatalogItems(catalog = [], practiceCards = []) {
  return [
    ...asArray(catalog),
    ...asArray(practiceCards).map((practiceCard) => ({
      ...practiceCard,
      evidenceNote: "Internal fictional practice card. It uses only nonsensitive sample scenarios.",
      sampleData: false
    }))
  ];
}

export function catalogFilterOptions(items = [], appConfig = {}, progressRecords = {}) {
  const browsableItems = asArray(items);
  const namedProfessionalFields = asArray(appConfig.professionalFields)
    .filter((field) => field !== "Other")
    .map(optionFromString);
  const durationOptions = fixedOptions({
    "under-30": "Under 30 minutes",
    "under-60": "30 to 59 minutes",
    "one-to-two-hours": "1 to 2 hours",
    "over-two-hours": "Over 2 hours",
    "duration-not-stated": "Duration not stated"
  });
  const certificateOptions = fixedOptions({
    "certificate-or-badge-available": "Certificate or badge available",
    "optional-paid-certificate": "Optional paid certificate",
    "no-certificate-claim": "No certificate claim",
    "certificate-not-verified": "Certificate status not verified"
  });
  const accessOptions = fixedOptions({
    "fully-free": "Fully free",
    "free-course-optional-paid-certificate": "Free course, optional paid certificate",
    "publicly-accessible-free-status-not-explicitly-confirmed": "Public access, free status needs review"
  });
  const completionOptions = fixedOptions({
    "not-started": "Not started",
    "started": "Started",
    "completed": "Completed"
  });

  return {
    practicalFluency: countOptions(
      browsableItems,
      asArray(appConfig.practicalFluencyLevels).map(optionFromConfig),
      (item) => item.practicalFluencyLevels
    ),
    technicalOrientation: countOptions(
      browsableItems,
      asArray(appConfig.technicalOrientationLevels).map(optionFromConfig),
      (item) => item.technicalOrientations
    ),
    pathStage: countOptions(
      browsableItems,
      asArray(appConfig.learningPathStages).map(optionFromString),
      (item) => [item.pathStage]
    ),
    provider: countOptions(
      browsableItems,
      uniqueSorted(browsableItems.map((item) => item.provider)).map(optionFromString),
      (item) => [item.provider]
    ),
    format: countOptions(
      browsableItems,
      uniqueSorted(browsableItems.map((item) => item.format)).map(optionFromString),
      (item) => [item.format]
    ),
    duration: countOptions(browsableItems, durationOptions, (item) => [durationBucket(item)]),
    certificate: countOptions(browsableItems, certificateOptions, (item) => [certificateBucket(item)]),
    access: countOptions(browsableItems, accessOptions, (item) => [accessBucket(item)]),
    completion: countOptions(browsableItems, completionOptions, (item) => [progressStatus(item, progressRecords)]),
    tags: countOptions(
      browsableItems,
      uniqueSorted(browsableItems.flatMap((item) => asArray(item.tags))).map(optionFromString),
      (item) => item.tags
    ),
    professionalField: countOptions(namedProfessionalFields, namedProfessionalFields, (option) => [option.id])
      .map((option) => ({
        ...option,
        count: browsableItems.filter((item) =>
          asArray(item.professionalFields).includes("All fields") ||
          asArray(item.professionalFields).includes(option.id)
        ).length
      })),
    workPattern: countOptions(
      browsableItems,
      asArray(appConfig.workPatterns).map(optionFromConfig),
      (item) => item.workPatterns
    )
  };
}

export function catalogItemMatchesFilters(item, filters = createDefaultCatalogFilters(), progressRecords = {}) {
  // Filtering uses OR logic inside each group and AND logic across groups.
  return (
    matchesSearch(item, filters.search) &&
    matchesFilterGroup(filters.practicalFluency, item.practicalFluencyLevels) &&
    matchesFilterGroup(filters.technicalOrientation, item.technicalOrientations) &&
    matchesFilterGroup(filters.pathStage, [item.pathStage]) &&
    matchesFilterGroup(filters.provider, [item.provider]) &&
    matchesFilterGroup(filters.format, [item.format]) &&
    matchesFilterGroup(filters.duration, [durationBucket(item)]) &&
    matchesFilterGroup(filters.certificate, [certificateBucket(item)]) &&
    matchesFilterGroup(filters.access, [accessBucket(item)]) &&
    matchesFilterGroup(filters.completion, [progressStatus(item, progressRecords)]) &&
    matchesFilterGroup(filters.tags, item.tags) &&
    matchesProfessionalField(filters.professionalField, item.professionalFields) &&
    matchesFilterGroup(filters.workPattern, item.workPatterns)
  );
}

export function filterCatalogItems(items = [], filters = createDefaultCatalogFilters(), progressRecords = {}) {
  return asArray(items).filter((item) => catalogItemMatchesFilters(item, filters, progressRecords));
}

export function sortCatalogItems(items = [], sort = "title-asc") {
  const sortedItems = [...asArray(items)];
  const byTitle = (left, right) => left.title.localeCompare(right.title);
  const byProvider = (left, right) => left.provider.localeCompare(right.provider) || byTitle(left, right);
  const byDuration = (left, right) => {
    const leftDuration = typeof left.estimatedMinutes === "number" ? left.estimatedMinutes : Number.POSITIVE_INFINITY;
    const rightDuration = typeof right.estimatedMinutes === "number" ? right.estimatedMinutes : Number.POSITIVE_INFINITY;
    return leftDuration - rightDuration || byTitle(left, right);
  };

  if (sort === "provider") {
    return sortedItems.sort(byProvider);
  }

  if (sort === "duration") {
    return sortedItems.sort(byDuration);
  }

  return sortedItems.sort(byTitle);
}

export function countActiveFilters(filters = createDefaultCatalogFilters()) {
  return Object.entries(filters).reduce((count, [key, value]) => {
    if (key === "sort") {
      return count;
    }

    if (key === "search") {
      return count + (normalizeText(value) ? 1 : 0);
    }

    return count + asArray(value).length;
  }, 0);
}
