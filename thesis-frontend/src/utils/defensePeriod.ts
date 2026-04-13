const ACTIVE_DEFENSE_PERIOD_ID_KEY = "activeDefensePeriodId";

const DEFENSE_PERIOD_ID_KEYS = ["defenseTermId", "periodId", "id"];

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

const findCaseInsensitiveValue = (
  record: Record<string, unknown>,
  keys: string[],
): unknown => {
  for (const key of keys) {
    if (key in record) {
      return record[key];
    }
  }

  const lowered = new Map(
    Object.entries(record).map(([key, value]) => [key.toLowerCase(), value]),
  );

  for (const key of keys) {
    const value = lowered.get(key.toLowerCase());
    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
};

export const normalizeDefensePeriodId = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    const normalized = Math.floor(value);
    return normalized > 0 ? normalized : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    if (!/^\d+$/.test(trimmed)) {
      return null;
    }

    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      return null;
    }

    const normalized = Math.floor(parsed);
    return normalized > 0 ? normalized : null;
  }

  return null;
};

export const extractDefensePeriodId = (payload: unknown): number | null => {
  const direct = normalizeDefensePeriodId(payload);
  if (direct) {
    return direct;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const candidate = extractDefensePeriodId(item);
      if (candidate) {
        return candidate;
      }
    }
    return null;
  }

  const record = toRecord(payload);
  if (!record) {
    return null;
  }

  const fromRecord = normalizeDefensePeriodId(
    findCaseInsensitiveValue(record, DEFENSE_PERIOD_ID_KEYS),
  );
  if (fromRecord) {
    return fromRecord;
  }

  const nestedCandidates = ["item", "items", "records", "list", "data", "result"];
  for (const key of nestedCandidates) {
    const candidate = extractDefensePeriodId(findCaseInsensitiveValue(record, [key]));
    if (candidate) {
      return candidate;
    }
  }

  return null;
};

export const getActiveDefensePeriodId = (): number | null => {
  if (typeof window === "undefined") {
    return null;
  }
  return normalizeDefensePeriodId(
    window.localStorage.getItem(ACTIVE_DEFENSE_PERIOD_ID_KEY),
  );
};

export const setActiveDefensePeriodId = (periodId: number | null): void => {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = normalizeDefensePeriodId(periodId);
  if (normalized) {
    window.localStorage.setItem(ACTIVE_DEFENSE_PERIOD_ID_KEY, String(normalized));
    return;
  }

  window.localStorage.removeItem(ACTIVE_DEFENSE_PERIOD_ID_KEY);
};
