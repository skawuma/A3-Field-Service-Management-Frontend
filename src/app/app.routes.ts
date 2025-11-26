import { Routes } from '@angular/router';
import { authRoutes } from './auth/auth.routes';
import { AuthGuard } from './core/guards/auth-guard';
import { techniciansRoutes } from './technicians/technicians.routes';
import { workordersRoutes } from './workorders/workorders.routes';
import { MainLayoutComponent } from './core/layout/main-layout';
import { roleGuard } from './core/guards/role-guard';

export const routes: Routes = [

  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },

  {
    path: 'auth',
    children: authRoutes
  },

  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [



      {
        path: 'dashboard',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'DISPATCH'] },
        loadComponent: () =>
          import('./core/layout/dashboard-component/dashboard-component')
            .then(m => m.DashboardComponent)
      },

      {
        path: 'technicians',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        children: techniciansRoutes
      },

      {
        path: 'workorders',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'DISPATCH', 'TECH'] },
        children: workordersRoutes
      }

    ]
  },

  { path: '**', redirectTo: 'auth/login' }
];
