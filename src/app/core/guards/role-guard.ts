import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth-service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = route.data?.['roles'] as string[] | undefined;
  const userRole = auth.getRole();

  // No allowed roles defined = allow access
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  // User has permission?
  if (userRole && allowedRoles.includes(userRole)) {
    return true;
  }

  // Otherwise → redirect
  router.navigate(['/workorders']);
  return false;
};
