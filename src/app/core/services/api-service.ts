import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import {
  WorkOrderCompletionReportRequest,
  WorkOrderCompletionReportResponse
} from '../models/completion-report.model';

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private buildUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${this.baseUrl}/${cleanPath}`;
  }

  getPage<T>(
    path: string,
    page: number,
    size: number,
    sort: string = 'lastName,asc',
    extraParams?: any
  ): Observable<PageResponse<T>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (sort) params = params.set('sort', sort);

    if (extraParams) {
      Object.keys(extraParams).forEach(key => {
        if (extraParams[key] !== null && extraParams[key] !== '') {
          params = params.set(key, extraParams[key]);
        }
      });
    }

    return this.http.get<PageResponse<T>>(this.buildUrl(path), { params });
  }

  getPageAdvanced<T>(path: string, params: any): Observable<PageResponse<T>> {
    return this.http.get<PageResponse<T>>(this.buildUrl(path), { params });
  }

  getOne<T>(path: string, id: number): Observable<T> {
    return this.http.get<T>(this.buildUrl(`${path}/${id}`));
  }

  get<T>(path: string): Observable<T> {
    return this.http.get<T>(this.buildUrl(path));
  }

  post<T>(path: string, body: any): Observable<T> {
    return this.http.post<T>(this.buildUrl(path), body);
  }

  put<T>(path: string, body: any): Observable<T> {
    return this.http.put<T>(this.buildUrl(path), body);
  }

  patch<T>(path: string, body: any): Observable<T> {
    return this.http.patch<T>(this.buildUrl(path), body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(this.buildUrl(path));
  }

  downloadBlob(path: string): Observable<Blob> {
  return this.http.get(this.buildUrl(path), {
    responseType: 'blob'
  });
}

  submitCompletionReport(
  id: number,
  body: WorkOrderCompletionReportRequest
): Observable<WorkOrderCompletionReportResponse> {
  return this.post<WorkOrderCompletionReportResponse>(
    `workorders/${id}/completion-report`,
    body
  );
}

getCompletionReport(id: number): Observable<WorkOrderCompletionReportResponse> {
  return this.get<WorkOrderCompletionReportResponse>(
    `workorders/${id}/completion-report`
  );
}

startWorkOrder(id: number): Observable<any> {
  return this.post(`workorders/${id}/start`, {});
}

returnWorkOrderToOpen(id: number, body: { reason?: string }): Observable<any> {
  return this.post(`workorders/${id}/return-to-open`, body);
}

reopenWorkOrder(id: number, body: { reason?: string }) {
  return this.post(`workorders/${id}/reopen`, body);
}

  
}
