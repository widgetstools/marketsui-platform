import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  template: `
    <div class="placeholder">
      <div class="placeholder-icon">{{ getIcon() }}</div>
      <div class="placeholder-title">{{ title }}</div>
      <div class="placeholder-sub">This view is under construction</div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      background: var(--bn-bg1);
      gap: 8px;
    }
    .placeholder-icon {
      font-size: 32px;
      opacity: 0.4;
    }
    .placeholder-title {
      font-family: var(--fi-sans);
      font-size: var(--fi-font-lg);
      font-weight: 600;
      color: var(--bn-t1);
    }
    .placeholder-sub {
      font-size: var(--fi-font-sm);
      color: var(--bn-t2);
    }
  `],
})
export class PlaceholderComponent {
  private route = inject(ActivatedRoute);
  title = (this.route.snapshot.data as any)['title'] ?? 'Coming Soon';

  getIcon(): string {
    switch (this.title) {
      case 'Risk': return '~';
      case 'Market': return '#';
      case 'Research': return '@';
      case 'Analytics': return '%';
      default: return '*';
    }
  }
}
