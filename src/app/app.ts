import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DemoBannerComponent } from './core/demo/demo-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, DemoBannerComponent],
  template: `
    <div class="app-shell">
      <app-demo-banner></app-demo-banner>
      <main class="route-shell">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    :host,
    .app-shell {
      display: block;
      height: 100vh;
      min-height: 0;
    }

    .app-shell {
      display: flex;
      flex-direction: column;
    }

    .route-shell {
      flex: 1 1 auto;
      min-height: 0;
    }
  `]
})
export class App {
  title = signal('a3-fsm-frontend');
}
