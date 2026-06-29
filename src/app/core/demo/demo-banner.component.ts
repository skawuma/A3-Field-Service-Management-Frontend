import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-demo-banner',
  standalone: true,
  template: `
    @if (demoMode) {
      <aside class="demo-banner" data-testid="demo-banner" role="status">
        <span class="demo-label">Demo Mode</span>
        <span>This is a public portfolio demo using fake data. Changes may reset periodically.</span>
      </aside>
    }
  `,
  styles: [`
    :host {
      display: block;
      flex: 0 0 auto;
    }

    .demo-banner {
      align-items: center;
      background: linear-gradient(90deg, #fff7d6, #fff2b8);
      border-bottom: 1px solid #e9c95b;
      color: #5d4300;
      display: flex;
      font-size: 0.88rem;
      gap: 10px;
      justify-content: center;
      min-height: 44px;
      padding: 8px 20px;
      text-align: center;
    }

    .demo-label {
      background: #6b4d00;
      border-radius: 999px;
      color: #fff;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      padding: 4px 9px;
      text-transform: uppercase;
      white-space: nowrap;
    }

    @media (max-width: 600px) {
      .demo-banner {
        align-items: flex-start;
        flex-direction: column;
        gap: 5px;
        text-align: left;
      }
    }
  `]
})
export class DemoBannerComponent {
  readonly demoMode = environment.demoMode;
}
