import { Routes } from '@angular/router';

export const workordersRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./workorders-list-component')
        .then(m => m.WorkordersListComponent)
  },
  { path: '**', redirectTo: '' }
];
