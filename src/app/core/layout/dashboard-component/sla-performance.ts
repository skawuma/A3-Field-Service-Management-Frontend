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
    percent: total === 0 ? 0 : Math.round((counts.completedWithinSlaCount / total) * 100)
  };
}
