import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';

export const AuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.hasValidAccessToken()) {
    return true;
  }

  if (!auth.hasValidRefreshToken()) {
    return router.createUrlTree(['/auth/login']);
  }

  return auth.ensureValidSession().pipe(
    map((isValid) => isValid ? true : router.createUrlTree(['/auth/login'])),
    catchError(() => of(router.createUrlTree(['/auth/login'])))
  );
};
