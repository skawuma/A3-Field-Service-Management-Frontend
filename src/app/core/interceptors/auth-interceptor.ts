import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth-service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.getToken();

  // ---- 1. Attach Authorization header ----
  const authReq = token
    ? req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {

      // ---- 2. Handle 401 (expired, invalid, missing token) ----
      if (error.status === 401) {
        auth.logout();
        router.navigate(['/login']);
      }

      // ---- 3. Handle 403 (forbidden) ----
      if (error.status === 403) {
        console.warn('Access denied (403): insufficient permissions.');
        // (Optional: show snackbar)
      }

      return throwError(() => error);
    })
  );
};
