import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { MainLayoutComponent } from './app/core/layout/main-layout';

bootstrapApplication(MainLayoutComponent, appConfig)
  .catch((err) => console.error(err));
