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

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly tokenKey = 'a3fsm_token';
  private readonly refreshKey = 'a3fsm_refresh';
  private readonly roleKey = 'a3fsm_role';

  constructor(private http: HttpClient) {}

  // ------------------------------------
  // LOGIN
  // ------------------------------------
  login(payload: LoginRequest) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, payload)
      .pipe(
        tap(res => {
          localStorage.setItem(this.tokenKey, res.accessToken);
          localStorage.setItem(this.refreshKey, res.refreshToken);
          localStorage.setItem(this.roleKey, res.role);
        })
      );
  }

  // ------------------------------------
  // LOGOUT
  // ------------------------------------
  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshKey);
    localStorage.removeItem(this.roleKey);
  }

  // ------------------------------------
  // TOKEN GETTERS
  // ------------------------------------
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshKey);
  }

  // ------------------------------------
  // ROLE HELPERS
  // ------------------------------------
  getRole(): string | null {
    return localStorage.getItem(this.roleKey);
  }

  isAdmin(): boolean {
    return this.getRole() === 'ADMIN';
  }

  isDispatch(): boolean {
    return this.getRole() === 'DISPATCH';
  }

  isTech(): boolean {
    return this.getRole() === 'TECH';
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
