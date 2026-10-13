export interface CompletedSlaCounts {
  completedWithinSlaCount: number;
  completedBreachedCount: number;
}

export function summarizeCompletedSla(counts: CompletedSlaCounts | null): { total: number; percent: number } {
  if (!counts) {
    return { total: 0, percent: 0 };
  }

  const total = counts.completedWithinSlaCount + counts.completedBreachedCount;
  return {
    total,
    percent: total === 0 ? 0 : Math.floor((counts.completedWithinSlaCount * 1000) / total) / 10
  };
}

export function formatSlaDuration(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value < 0) return 'No data';
  const roundedMinutes = Math.round(value);
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}
