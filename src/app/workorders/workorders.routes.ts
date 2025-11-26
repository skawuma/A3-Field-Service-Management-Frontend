import { Routes } from '@angular/router';

export const workordersRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./workorders-list-component')
        .then(m => m.WorkordersListComponent)
  },

  {
    path: ':id',
    loadComponent: () =>
      import('./workorder-detail-component')
        .then(m => m.WorkOrderDetailComponent)
  },

  { path: '**', redirectTo: '' }
];
