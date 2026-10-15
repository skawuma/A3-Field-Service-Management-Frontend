import { Subject } from 'rxjs';
import { SlaRefresh } from './sla-refresh';

describe('SLA refresh', () => {
  let refresh: SlaRefresh<number>;
  let success: jasmine.Spy;
  let failure: jasmine.Spy;

  beforeEach(() => {
    refresh = new SlaRefresh<number>();
    success = jasmine.createSpy('success');
    failure = jasmine.createSpy('failure');
  });

  function load(): Subject<number> {
    const request = new Subject<number>();
    refresh.load(request, success, failure);
    return request;
  }

  it('keeps the newer result when requests finish out of order', () => {
    const older = load();
    const newer = load();
    expect(older.observers.length).toBe(0);
    newer.next(9);
    const successAt = refresh.lastSuccessAt;
    older.next(3);

    expect(refresh.value).toBe(9);
    expect(refresh.lastSuccessAt).toBe(successAt);
    expect(refresh.loading).toBeFalse();
    expect(refresh.refreshing).toBeFalse();
    expect(refresh.error).toBeFalse();
    expect(success).toHaveBeenCalledTimes(1);
  });

  it('retains values and stale status through a failed refresh and retry', () => {
    load().next(3);
    const successAt = refresh.lastSuccessAt;
    const failed = load();
    expect(refresh.refreshing).toBeTrue();
    const error = new Error('unavailable');
    failed.error(error);

    expect(refresh.value).toBe(3);
    expect(refresh.lastSuccessAt).toBe(successAt);
    expect(refresh.error).toBeTrue();
    expect(refresh.refreshing).toBeFalse();
    expect(failure).toHaveBeenCalledOnceWith(error);

    const retry = load();
    expect(refresh.error).toBeTrue();
    expect(refresh.refreshing).toBeTrue();
    retry.next(9);
    expect(refresh.value).toBe(9);
    expect(refresh.error).toBeFalse();
    expect(refresh.refreshing).toBeFalse();
  });

  it('ignores a late failure from a superseded request', () => {
    const older = load();
    load().next(9);
    older.error(new Error('late failure'));
    expect(refresh.value).toBe(9);
    expect(refresh.error).toBeFalse();
    expect(failure).not.toHaveBeenCalled();
  });

  it('shows an initial failure without inventing data', () => {
    const request = load();
    expect(refresh.loading).toBeTrue();
    request.error(new Error('unavailable'));
    expect(refresh.value).toBeNull();
    expect(refresh.lastSuccessAt).toBeNull();
    expect(refresh.loading).toBeFalse();
    expect(refresh.error).toBeTrue();
  });

  it('stops the in-flight request when disposed', () => {
    const request = load();
    refresh.dispose();
    expect(request.observers.length).toBe(0);
    request.next(9);
    expect(refresh.value).toBeNull();
    expect(success).not.toHaveBeenCalled();
  });
});
