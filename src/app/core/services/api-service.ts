import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {

  private readonly baseUrl = environment.apiUrl;  // e.g. http://localhost:8080/api

  constructor(private http: HttpClient) {}

  /** 
   * SAFE URL BUILDER — Removes leading slash to prevent double-slash `//` issues 
   */
  private buildUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${this.baseUrl}/${cleanPath}`;
  }

  /** GET Paged Results */
  getPage<T>(path: string, page: number, size: number, sort: string = 'lastName,asc', extraParams?: any): Observable<PageResponse<T>> {
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

  getPageAdvanced<T>(path: string, params: any) {
    return this.http.get<PageResponse<T>>(this.buildUrl(path), { params });
  }

  /** GET ONE */
  getOne<T>(path: string, id: number): Observable<T> {
    return this.http.get<T>(this.buildUrl(`${path}/${id}`));
  }

  /** GET LIST or Custom Endpoint */
  get<T>(path: string): Observable<T> {
    return this.http.get<T>(this.buildUrl(path));
  }

  /** POST */
  post<T>(path: string, body: any): Observable<T> {
    return this.http.post<T>(this.buildUrl(path), body);
  }

  /** PUT */
  put<T>(path: string, body: any): Observable<T> {
    return this.http.put<T>(this.buildUrl(path), body);
  }

  /** PATCH */
  patch<T>(path: string, body: any): Observable<T> {
    return this.http.patch<T>(this.buildUrl(path), body);
  }

  /** DELETE */
  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(this.buildUrl(path));
  }

  downloadBlob(path: string) {
  return this.http.get(`${this.baseUrl}/${path}`, {
    responseType: 'blob'
  });
}

submitCompletionReport(id: number, body: any) {
  return this.post(`workorders/${id}/completion-report`, body);
}

getCompletionReport(id: number) {
  return this.get(`workorders/${id}/completion-report`);
}

}
