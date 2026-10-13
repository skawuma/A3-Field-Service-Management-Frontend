import { summarizeCompletedSla } from './sla-performance';

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
  });
});
