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
 
  
  private readonly baseUrl = environment.apiUrl;  // 👈 USE ENV

  constructor(private http: HttpClient) {}

  /** GET paged results */
getPage<T>(path: string, page: number, size: number, sortBy?: string, extraParams?: any): Observable<PageResponse<T>> {
  let params = new HttpParams()
    .set('page', page)
    .set('size', size);

  if (sortBy) {
    params = params.set('sortBy', sortBy);
  }

  if (extraParams) {
    Object.keys(extraParams).forEach(key => {
      if (extraParams[key] !== null && extraParams[key] !== '') {
        params = params.set(key, extraParams[key]);
      }
    });
  }

  return this.http.get<PageResponse<T>>(`${this.baseUrl}/${path}`, { params });
}

getPageAdvanced<T>(path: string, params: any) {
  return this.http.get<PageResponse<T>>(`${this.baseUrl}/${path}`, { params });
}



  /** GET single or list (non-paginated) */
  get<T>(path: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${path}`);
  }

  /** POST */
  post<T>(path: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${path}`, body);
  }

  /** PUT */
  put<T>(path: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/${path}`, body);
  }

  /** PATCH */
  patch<T>(path: string, body: any): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}/${path}`, body);
  }

  /** DELETE */
  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}/${path}`);
  }
}

