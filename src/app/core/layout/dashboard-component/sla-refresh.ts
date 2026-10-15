import { Observable } from 'rxjs';

export class SlaRefresh<T> {
  value: T | null = null;
  loading = false;
  refreshing = false;
  error = false;
  lastSuccessAt: Date | null = null;

  private requestId = 0;

  load(source: Observable<T>, onSuccess: (at: Date) => void, onError: (error: unknown) => void): void {
    const requestId = ++this.requestId;
    this.loading = this.value === null;
    this.refreshing = this.value !== null;

    source.subscribe({
      next: value => {
        if (requestId !== this.requestId) return;
        this.value = value;
        this.error = false;
        this.loading = false;
        this.refreshing = false;
        this.lastSuccessAt = new Date();
        onSuccess(this.lastSuccessAt);
      },
      error: error => {
        if (requestId !== this.requestId) return;
        this.loading = false;
        this.refreshing = false;
        this.error = true;
        onError(error);
      }
    });
  }
}
