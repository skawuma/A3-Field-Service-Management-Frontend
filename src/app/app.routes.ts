import { Routes } from '@angular/router';
import { authRoutes } from './auth/auth.routes';
import { AuthGuard } from './core/guards/auth-guard';
import { techniciansRoutes } from './technicians/technicians.routes';
import { workordersRoutes } from './workorders/workorders.routes';
import { MainLayoutComponent } from './core/layout/main-layout'; // <-- IMPORTANT

export const routes: Routes = [

  // --- Public Routes (Login)
  {
    path: 'auth',
    children: authRoutes
  },

  // --- Protected Routes (inside Main Layout)
  {
    path: '',
    component: MainLayoutComponent,   // <-- THIS FIXES YOUR BOOTSTRAP ERROR
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      {
        path: 'dashboard',
        loadComponent: () =>
          import('./core/layout/dashboard-component/dashboard-component')
            .then(m => m.DashboardComponent)
      },

      {
        path: 'technicians',
        children: techniciansRoutes
      },

      {
        path: 'workorders',
        children: workordersRoutes
      }
    ]
  },

  // --- Fallback
  { path: '**', redirectTo: '' }
];
