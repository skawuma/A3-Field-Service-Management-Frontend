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
      height: 100dvh;
      min-height: 0;
      min-width: 0;
      overflow: hidden;
    }

    .app-shell {
      display: flex;
      flex-direction: column;
    }

    .route-shell {
      flex: 1 1 auto;
      min-height: 0;
      min-width: 0;
      overflow: auto;
      -webkit-overflow-scrolling: touch;
    }
  `]
})
export class App {
  title = signal('a3-fsm-frontend');
}
