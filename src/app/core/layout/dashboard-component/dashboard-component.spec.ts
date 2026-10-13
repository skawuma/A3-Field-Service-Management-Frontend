import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { DashboardComponent } from './dashboard-component';

type SlaIntelligence = NonNullable<DashboardComponent['slaIntelligence']>;

function snapshot(within: number): SlaIntelligence {
  return {
    nearBreachCount: 2,
    breachedActiveCount: 1,
    completedWithinSlaCount: within,
    completedBreachedCount: 1,
    averageTimeToAssignMinutes: 5,
    averageTimeToStartMinutes: 10,
    averageTimeToCompleteMinutes: 30,
    technicianPerformance: []
  };
}

describe('Dashboard execution SLA refresh', () => {
  let component: DashboardComponent;
  let requests: Subject<SlaIntelligence>[];
  let get: jasmine.Spy;

  beforeEach(() => {
    requests = [];
    get = jasmine.createSpy('get').and.callFake(() => {
      const request = new Subject<SlaIntelligence>();
      requests.push(request);
      return request;
    });
    TestBed.configureTestingModule({});
    // Exercise the real refresh method without starting unrelated dashboard loads.
    component = TestBed.runInInjectionContext(() => new DashboardComponent(
      { get } as unknown as ConstructorParameters<typeof DashboardComponent>[0],
      {} as ConstructorParameters<typeof DashboardComponent>[1],
      {} as ConstructorParameters<typeof DashboardComponent>[2],
      {} as ConstructorParameters<typeof DashboardComponent>[3],
      {} as ConstructorParameters<typeof DashboardComponent>[4]
    ));
    spyOn(console, 'error');
  });

  it('keeps the newer snapshot when overlapping requests respond out of order', () => {
    component.loadSlaIntelligence();
    component.loadSlaIntelligence();
    const newer = snapshot(9);
    requests[1].next(newer);
    const successAt = component.slaLastSuccessAt;
    requests[0].next(snapshot(3));

    expect(get.calls.allArgs()).toEqual([
      ['dashboard/sla-intelligence'], ['dashboard/sla-intelligence']
    ]);
    expect(component.slaIntelligence).toBe(newer);
    expect(component.slaLastSuccessAt).toBe(successAt);
    expect(component.slaIntelligenceLoading).toBeFalse();
    expect(component.slaIntelligenceRefreshing).toBeFalse();
    expect(component.slaIntelligenceError).toBeFalse();
  });

  it('retains successful values and stale status through a failed refresh and pending retry', () => {
    component.loadSlaIntelligence();
    const previous = snapshot(3);
    requests[0].next(previous);
    const successAt = component.slaLastSuccessAt;
    expect(successAt).not.toBeNull();

    component.loadSlaIntelligence();
    expect(component.slaIntelligenceLoading).toBeFalse();
    expect(component.slaIntelligenceRefreshing).toBeTrue();
    expect(component.slaIntelligence).toBe(previous);
    requests[1].error(new HttpErrorResponse({ status: 503 }));
    expect(component.slaIntelligence).toBe(previous);
    expect(component.slaLastSuccessAt).toBe(successAt);
    expect(component.slaIntelligenceError).toBeTrue();
    expect(component.slaIntelligenceRefreshing).toBeFalse();

    component.loadSlaIntelligence();
    expect(component.slaIntelligenceError).toBeTrue();
    expect(component.slaIntelligenceRefreshing).toBeTrue();
    expect(component.slaIntelligence).toBe(previous);
    expect(component.slaLastSuccessAt).toBe(successAt);
    const recovered = snapshot(9);
    requests[2].next(recovered);
    expect(component.slaIntelligence).toBe(recovered);
    expect(component.slaIntelligenceError).toBeFalse();
    expect(component.slaIntelligenceRefreshing).toBeFalse();
  });

  it('ignores a superseded failure after a newer request succeeds', () => {
    component.loadSlaIntelligence();
    component.loadSlaIntelligence();
    const newer = snapshot(9);
    requests[1].next(newer);
    requests[0].error(new HttpErrorResponse({ status: 503 }));
    expect(component.slaIntelligence).toBe(newer);
    expect(component.slaIntelligenceError).toBeFalse();
    expect(component.slaIntelligenceRefreshing).toBeFalse();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('exposes an initial failure without inventing compliance data', () => {
    component.loadSlaIntelligence();
    expect(component.slaIntelligenceLoading).toBeTrue();
    requests[0].error(new HttpErrorResponse({ status: 503 }));
    expect(component.slaIntelligence).toBeNull();
    expect(component.slaLastSuccessAt).toBeNull();
    expect(component.slaIntelligenceLoading).toBeFalse();
    expect(component.slaIntelligenceError).toBeTrue();
  });
});
