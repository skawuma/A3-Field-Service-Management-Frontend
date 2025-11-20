import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  role: string;
}

interface LoginRequest {
  email: string;
  password: string;
}


@Injectable({ providedIn: 'root' })
export class AuthService {
   private readonly baseUrl = `${environment.apiUrl}/auth`; // 👈 USE ENV
  private readonly tokenKey = 'a3fsm_token';
  private readonly refreshKey = 'a3fsm_refresh';

  constructor(private http: HttpClient) {}

login(payload: { email?: string; username?: string; password: string }) {
  return this.http.post<AuthResponse>(`${this.baseUrl}/login`, {
    email: payload.email,  // map email → username
    password: payload.password
  })
  .pipe(
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
  return localStorage.getItem(this.tokenKey);
}

isAuthenticated(): boolean {
  return !!this.getToken();
}
  
}
