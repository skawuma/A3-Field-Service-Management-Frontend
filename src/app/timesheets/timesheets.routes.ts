import { Routes } from '@angular/router';
import { roleGuard } from '../core/guards/role-guard';

export const timesheetRoutes: Routes = [
  {
    path: 'my',
    canActivate: [roleGuard],
    data: { roles: ['TECH'] },
    loadComponent: () =>
      import('./timesheet-detail.component').then((module) => module.TimesheetDetailComponent),
  },
  {
    path: 'admin',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'DISPATCH'] },
    loadComponent: () =>
      import('./timesheet-admin.component').then((module) => module.TimesheetAdminComponent),
  },
  {
    path: ':id',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'DISPATCH', 'TECH'] },
    loadComponent: () =>
      import('./timesheet-detail.component').then((module) => module.TimesheetDetailComponent),
  },
];
