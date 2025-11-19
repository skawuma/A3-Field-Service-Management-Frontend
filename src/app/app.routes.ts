import { Routes } from '@angular/router';
import { authRoutes } from './auth/auth.routes';
import { AuthGuard } from './core/guards/auth-guard';
import { techniciansRoutes } from './technicians/technicians.routes';
import { workordersRoutes } from './workorders/workorders.routes';


export const routes: Routes = [ {
    path: 'auth',
    children: authRoutes
  },
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      // { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      // {
      //   path: 'dashboard',
      //   loadComponent: () =>
      //     import('./core/layout/dashboard.component').then(m => m.DashboardComponent)
      // },
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
  { path: '**', redirectTo: '' }
];