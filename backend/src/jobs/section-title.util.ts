/** Normalize catalog / job section labels for stable bank keys. */
export function normalizeSectionTitle(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}
