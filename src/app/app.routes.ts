import { Routes } from '@angular/router';
import { authRoutes } from './auth/auth.routes';
import { AuthGuard } from './core/guards/auth-guard';
import { techniciansRoutes } from './technicians/technicians.routes';
import { workordersRoutes } from './workorders/workorders.routes';
import { MainLayoutComponent } from './core/layout/main-layout';
import { roleGuard } from './core/guards/role-guard';
import { timesheetRoutes } from './timesheets/timesheets.routes';

export const routes: Routes = [

  // Default redirect
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },

  // Authentication pages
  {
    path: 'auth',
    children: authRoutes
  },

  // Main authenticated layout
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [

      // Dashboard
      {
        path: 'dashboard',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'DISPATCH', 'TECH'] },
        loadComponent: () =>
          import('./core/layout/dashboard-component/dashboard-component')
            .then(m => m.DashboardComponent)
      },

      // Technicians
      {
        path: 'technicians',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        children: techniciansRoutes
      },

      {
        path: 'reports',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'DISPATCH'] },
        loadComponent: () =>
          import('./reports/reports.component')
            .then(m => m.ReportsComponent)
      },

      // WORKORDERS MODULE
      {
        path: 'workorders',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'DISPATCH', 'TECH'] },
        children: [
          ...workordersRoutes,

          // ⭐⭐⭐ THE MISSING ROUTE ⭐⭐⭐
          {
            path: ':id',
            loadComponent: () =>
              import('./workorders/workorder-detail-component')
                .then(m => m.WorkOrderDetailComponent)
          }
        ]
      },

      {
        path: 'timesheets',
        children: timesheetRoutes
      }

    ]
  },

  // Wildcard
  { path: '**', redirectTo: 'auth/login' }
];
