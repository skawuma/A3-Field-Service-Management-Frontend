import { formatSlaDuration, summarizeCompletedSla } from './sla-performance';

describe('completed execution SLA performance', () => {
  it('keeps compliance empty when no completed execution clocks exist', () => {
    expect(summarizeCompletedSla(null)).toEqual({ total: 0, percent: 0 });
    expect(summarizeCompletedSla({ completedWithinSlaCount: 0, completedBreachedCount: 0 }))
      .toEqual({ total: 0, percent: 0 });
  });

  it('counts both met and breached completions in the denominator', () => {
    expect(summarizeCompletedSla({ completedWithinSlaCount: 3, completedBreachedCount: 1 }))
      .toEqual({ total: 4, percent: 75 });
    expect(summarizeCompletedSla({ completedWithinSlaCount: 0, completedBreachedCount: 2 }))
      .toEqual({ total: 2, percent: 0 });
    expect(summarizeCompletedSla({ completedWithinSlaCount: 1999, completedBreachedCount: 1 }))
      .toEqual({ total: 2000, percent: 99.9 });
  });
});

describe('SLA duration display', () => {
  it('rounds before splitting hours and minutes', () => {
    expect(formatSlaDuration(59.6)).toBe('1h 0m');
    expect(formatSlaDuration(142.3333)).toBe('2h 22m');
  });

  it('shows missing or invalid averages as no data', () => {
    expect(formatSlaDuration(null)).toBe('No data');
    expect(formatSlaDuration(Number.NaN)).toBe('No data');
  });
});
