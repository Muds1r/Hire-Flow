import { isTestIntensityLevel } from '../../../types/test-intensity';
import type { JobSectionConfig, TestIntensityLevel } from '../types';

export function parseJobAssessmentSectionConfig(
  raw: unknown,
): JobSectionConfig[] | null {
  if (!Array.isArray(raw)) {
    return null;
  }
  const out: JobSectionConfig[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const title =
      typeof (row as { title?: unknown }).title === 'string'
        ? (row as { title: string }).title.trim()
        : '';
    const intensity = (row as { intensity?: unknown }).intensity;
    if (title.length < 2 || !isTestIntensityLevel(intensity)) {
      continue;
    }
    out.push({ title, intensity: intensity as TestIntensityLevel });
  }
  return out.length ? out : null;
}
