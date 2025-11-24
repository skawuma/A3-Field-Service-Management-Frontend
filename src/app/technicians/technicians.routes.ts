import { Routes } from '@angular/router';

export const techniciansRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./technicians-list-component')
        .then(m => m.TechniciansListComponent)
  },
  { path: '**', redirectTo: '' }
];
