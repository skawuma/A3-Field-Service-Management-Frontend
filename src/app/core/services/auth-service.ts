import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = 'http://localhost:8080/api/auth';
  private readonly tokenKey = 'a3fsm_token';
  private readonly refreshKey = 'a3fsm_refresh';

  constructor(private http: HttpClient) {}

  login(payload: LoginRequest) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, payload).pipe(
      tap(res => {
        localStorage.setItem(this.tokenKey, res.accessToken);
        localStorage.setItem(this.refreshKey, res.refreshToken);
      })
    );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshKey);
  }


private isBrowser(): boolean {
  return typeof window !== 'undefined';
}

getToken(): string | null {
  if (!this.isBrowser()) return null;
  return localStorage.getItem('token');
}

isAuthenticated(): boolean {
  return !!this.getToken();
}
  
}
