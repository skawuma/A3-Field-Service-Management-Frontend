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
    this.clearStoredValue(this.tokenKey);
    this.clearStoredValue(this.refreshKey);
    this.clearStoredValue(this.roleKey);
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
    return this.getStoredValue(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return this.getStoredValue(this.refreshKey);
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

    return this.getStoredValue(this.roleKey);
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
  this.setStoredValue(this.tokenKey, response.accessToken);
  this.setStoredValue(this.refreshKey, response.refreshToken);
  this.setStoredValue(this.roleKey, response.role);
}

  private getSessionStorage(): Storage | null {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.sessionStorage;
  }

  private getLegacyStorage(): Storage | null {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.localStorage;
  }

  private getStoredValue(key: string): string | null {
    const sessionValue = this.getSessionStorage()?.getItem(key);
    if (sessionValue) {
      return sessionValue;
    }

    const legacyValue = this.getLegacyStorage()?.getItem(key);
    if (!legacyValue) {
      return null;
    }

    this.getSessionStorage()?.setItem(key, legacyValue);
    this.getLegacyStorage()?.removeItem(key);
    return legacyValue;
  }

  private setStoredValue(key: string, value: string): void {
    this.getSessionStorage()?.setItem(key, value);
    this.getLegacyStorage()?.removeItem(key);
  }

  private clearStoredValue(key: string): void {
    this.getSessionStorage()?.removeItem(key);
    this.getLegacyStorage()?.removeItem(key);
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
