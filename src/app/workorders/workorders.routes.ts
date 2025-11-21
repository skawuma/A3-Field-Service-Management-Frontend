import { Routes } from '@angular/router';



export const workordersRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./workorders-list-component').then(m => m.WorkordersListComponent)
  }
];
