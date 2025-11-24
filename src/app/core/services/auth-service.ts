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

  constructor(private http: HttpClient) {}

  // -------------------------------
  // LOGIN
  // -------------------------------
  login(payload: LoginRequest) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, payload)
      .pipe(
        tap(res => {
          localStorage.setItem(this.tokenKey, res.accessToken);
          localStorage.setItem(this.refreshKey, res.refreshToken);
        })
      );
  }

  // -------------------------------
  // LOGOUT
  // -------------------------------
  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshKey);
  }

  // -------------------------------
  // TOKEN GETTERS
  // -------------------------------
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshKey);
  }

  // -------------------------------
  // AUTH STATE
  // -------------------------------
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
