import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  role: string;
}

interface JwtPayload {
  exp?: number;
  id?: number | string;
  role?: string;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/auth`;
  private readonly tokenKey = 'a3fsm_token';
  private readonly refreshKey = 'a3fsm_refresh';
  private readonly roleKey = 'a3fsm_role';
  private refreshRequest$?: Observable<AuthResponse>;

  constructor(private http: HttpClient) {}

  // ------------------------------------
  // LOGIN
  // ------------------------------------
  login(payload: LoginRequest) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, payload)
      .pipe(
        tap(res => this.storeSession(res))
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

  refreshSession(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken || this.isTokenExpired(refreshToken)) {
      return throwError(() => new Error('No valid refresh token available.'));
    }

    if (this.refreshRequest$) {
      return this.refreshRequest$;
    }

    const request$ = this.http
      .post<AuthResponse>(`${this.baseUrl}/refresh`, { refreshToken })
      .pipe(
        tap(response => this.storeSession(response)),
        shareReplay({ bufferSize: 1, refCount: false }),
        finalize(() => {
          this.refreshRequest$ = undefined;
        })
      );

    this.refreshRequest$ = request$;
    return request$;
  }

  ensureValidSession(): Observable<boolean> {
    if (this.hasValidAccessToken()) {
      return of(true);
    }

    if (!this.hasValidRefreshToken()) {
      return of(false);
    }

    return this.refreshSession().pipe(
      map(() => true),
      catchError(() => of(false))
    );
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

  hasValidAccessToken(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  hasValidRefreshToken(): boolean {
    const token = this.getRefreshToken();
    return !!token && !this.isTokenExpired(token);
  }

  // ------------------------------------
  // ROLE HELPERS
  // ------------------------------------
  // getRole(): string | null {
  //   return localStorage.getItem(this.roleKey);
  // }

  getRole(): string | null {
    const payload = this.decodeToken(this.getToken());
    if (payload?.role) {
      return payload.role;
    }

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
    return this.hasValidAccessToken() || this.hasValidRefreshToken();
  }

  // ------------------------------------
// USER ID FROM JWT
// ------------------------------------
getUserId(): number | null {
  const payload = this.decodeToken(this.getToken());
  return payload?.id ? Number(payload.id) : null;
}

private storeSession(response: AuthResponse) {
  localStorage.setItem(this.tokenKey, response.accessToken);
  localStorage.setItem(this.refreshKey, response.refreshToken);
  localStorage.setItem(this.roleKey, response.role);
}

  private decodeToken(token: string | null): JwtPayload | null {
    if (!token) {
      return null;
    }

    try {
      return JSON.parse(atob(token.split('.')[1])) as JwtPayload;
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    const expiration = typeof payload?.['exp'] === 'number' ? payload['exp'] : null;

  if (!expiration) {
    return true;
  }

  return Date.now() >= (expiration * 1000);
}

}
