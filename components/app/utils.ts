"use client";

export const SYSTEM_DATE = new Date("2026-03-24T00:00:00Z");

export function createId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export function matchesQuery(values: Array<string | undefined>, query: string) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return true;
  }

  return values.some((value) =>
    normalizeText(value ?? "").includes(normalizedQuery),
  );
}

export function formatDisplayDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function toDateInputValue(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "2026-03-24";
  }

  return date.toISOString().slice(0, 10);
}

export function isWithinDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const diff = date.getTime() - SYSTEM_DATE.getTime();
  const diffDays = diff / (1000 * 60 * 60 * 24);

  return diffDays >= 0 && diffDays <= days;
}

export function triggerDownload(
  filename: string,
  contents: string,
  mimeType = "text/plain;charset=utf-8",
) {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

export function toCsv(rows: string[][]) {
  return rows
    .map((row) =>
      row
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");
}
