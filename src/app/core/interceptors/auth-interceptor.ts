import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth-service';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

const REFRESH_RETRY = new HttpContextToken<boolean>(() => false);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const requestUrl = req.url || '';
  const isAuthRequest =
    requestUrl.includes('/auth/login') ||
    requestUrl.includes('/auth/refresh') ||
    requestUrl.includes('/auth/register') ||
    requestUrl.includes('/auth/me');

  const token = auth.getToken();

  const authReq = !isAuthRequest && token
    ? req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      if (isAuthRequest || req.context.get(REFRESH_RETRY) || !auth.hasValidRefreshToken()) {
        auth.logout();
        router.navigate(['/auth/login']);
        return throwError(() => error);
      }

      return auth.refreshSession().pipe(
        switchMap(() => {
          const refreshedToken = auth.getToken();

          if (!refreshedToken) {
            auth.logout();
            router.navigate(['/auth/login']);
            return throwError(() => error);
          }

          return next(req.clone({
            setHeaders: { Authorization: `Bearer ${refreshedToken}` },
            context: req.context.set(REFRESH_RETRY, true)
          }));
        }),
        catchError((refreshError: HttpErrorResponse) => {
          auth.logout();
          router.navigate(['/auth/login']);
          return throwError(() => refreshError);
        })
      );
    })
  );
};
