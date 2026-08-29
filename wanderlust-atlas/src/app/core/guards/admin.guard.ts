import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Wait for auth loading
  let attempts = 0;
  while (auth.loading() && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  if (auth.isLoggedIn() && auth.isAdmin()) {
    return true;
  }

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/auth']);
  }

  return router.createUrlTree(['/']);
};
