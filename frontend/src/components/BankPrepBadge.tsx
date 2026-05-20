import { bankPrepBadge } from '../utils/bankPrepPhase';
import type { Job } from '../types';

type Props = {
  job: Pick<
    Job,
    'assessmentBankReady' | 'assessmentBankPrepPhase' | 'assessmentSectionTitles'
  >;
};

export function BankPrepBadge({ job }: Props) {
  const badge = bankPrepBadge(job);
  if (!badge) {
    return null;
  }
  return (
    <span className={`text-xs font-medium ${badge.className}`} title={badge.title}>
      {badge.label}
    </span>
  );
}
