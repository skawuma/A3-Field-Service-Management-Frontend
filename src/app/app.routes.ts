import { Routes } from '@angular/router';
import { authRoutes } from './auth/auth.routes';
import { AuthGuard } from './core/guards/auth-guard';
import { techniciansRoutes } from './technicians/technicians.routes';
import { workordersRoutes } from './workorders/workorders.routes';
import { MainLayoutComponent } from './core/layout/main-layout';

export const routes: Routes = [

  // --- Public Root Redirect
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },

  // --- Public routes (Login Flow)
  {
    path: 'auth',
    children: authRoutes
  },

  // --- Protected Routes
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', loadComponent: () =>
          import('./core/layout/dashboard-component/dashboard-component')
            .then(m => m.DashboardComponent)
      },
      { path: 'technicians', children: techniciansRoutes },
      { path: 'workorders', children: workordersRoutes }
    ]
  },

  // --- Fallback
  { path: '**', redirectTo: 'auth/login' }
];
