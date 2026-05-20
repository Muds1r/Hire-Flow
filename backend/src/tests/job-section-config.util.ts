import { isTestIntensityLevel, type TestIntensityLevel } from '../common/test-intensity';
import { normalizeSectionTitle } from '../jobs/section-title.util';

export type JobSectionConfig = {
  title: string;
  intensity: TestIntensityLevel;
};

export function parseJobAssessmentSectionConfig(raw: unknown): JobSectionConfig[] | null {
  if (!Array.isArray(raw)) {
    return null;
  }
  const out: JobSectionConfig[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') {
      continue;
    }
    const title =
      typeof (row as { title?: unknown }).title === 'string'
        ? normalizeSectionTitle((row as { title: string }).title)
        : '';
    const intensity = (row as { intensity?: unknown }).intensity;
    if (title.length < 2 || !isTestIntensityLevel(intensity)) {
      continue;
    }
    out.push({ title, intensity });
  }
  return out.length ? out : null;
}

export function sectionTitlesFromConfig(config: JobSectionConfig[]): string[] {
  return [...new Set(config.map((c) => c.title))];
}
