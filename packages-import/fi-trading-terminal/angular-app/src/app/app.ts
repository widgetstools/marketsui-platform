import { Component, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TICKER_STRIP, type TickerItem } from './services/trading-data.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ButtonModule],
  template: `
    <!-- Top Bar -->
    <div class="top-bar">
      <div class="top-bar-left">
        <div class="logo">
          <span class="logo-fi">FI</span>
          <span class="logo-sep">|</span>
          <span class="logo-text">Trading Terminal</span>
        </div>

        <nav class="tab-nav">
          @for (tab of tabs; track tab.route) {
            <a
              class="tab-link"
              [routerLink]="tab.route"
              routerLinkActive="tab-active"
            >
              {{ tab.label }}
            </a>
          }
        </nav>
      </div>

      <div class="top-bar-right">
        <div class="ticker-strip">
          @for (item of tickerStrip; track item.label) {
            <div class="ticker-item">
              <span class="ticker-label">{{ item.label }}</span>
              <span class="ticker-value">{{ item.value }}</span>
              <span [class]="item.up ? 'ticker-change up' : 'ticker-change down'">
                {{ item.change }}
              </span>
            </div>
          }
        </div>

        <button class="theme-toggle" (click)="toggleTheme()">
          {{ isDark() ? 'Light' : 'Dark' }}
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="content-area">
      <router-outlet />
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      background: var(--bn-bg);
    }

    /* ── Top Bar ── */
    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 38px;
      padding: 0 10px;
      background: var(--bn-bg1);
      border-bottom: 1px solid var(--bn-border);
      flex-shrink: 0;
    }
    .top-bar-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .top-bar-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    /* ── Logo ── */
    .logo {
      display: flex;
      align-items: center;
      gap: 6px;
      padding-right: 12px;
      border-right: 1px solid var(--bn-border);
    }
    .logo-fi {
      font-family: var(--fi-mono);
      font-size: var(--fi-font-md);
      font-weight: 700;
      color: var(--bn-yellow);
      letter-spacing: 0.06em;
    }
    .logo-sep {
      color: var(--bn-t3);
      font-size: var(--fi-font-sm);
    }
    .logo-text {
      font-family: var(--fi-sans);
      font-size: var(--fi-font-sm);
      color: var(--bn-t1);
      letter-spacing: 0.03em;
    }

    /* ── Tab Navigation ── */
    .tab-nav {
      display: flex;
      align-items: center;
      gap: 2px;
    }
    .tab-link {
      font-family: var(--fi-sans);
      font-size: var(--fi-font-sm);
      font-weight: 500;
      color: var(--bn-t1);
      text-decoration: none;
      padding: 8px 12px;
      border-bottom: 2px solid transparent;
      transition: color 150ms ease, border-color 150ms ease;
      cursor: pointer;
    }
    .tab-link:hover {
      color: var(--bn-t0);
    }
    .tab-active {
      color: var(--bn-t0);
      border-bottom-color: var(--bn-yellow);
    }

    /* ── Ticker Strip ── */
    .ticker-strip {
      display: flex;
      align-items: center;
      gap: 10px;
      overflow: hidden;
    }
    .ticker-item {
      display: flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
    }
    .ticker-label {
      font-family: var(--fi-sans);
      font-size: var(--fi-font-xs);
      color: var(--bn-t2);
    }
    .ticker-value {
      font-family: var(--fi-mono);
      font-size: var(--fi-font-xs);
      color: var(--bn-t0);
      font-weight: 500;
    }
    .ticker-change {
      font-family: var(--fi-mono);
      font-size: var(--fi-font-xs);
      font-weight: 500;
    }
    .ticker-change.up { color: var(--bn-green); }
    .ticker-change.down { color: var(--bn-red); }

    /* ── Theme Toggle ── */
    .theme-toggle {
      font-family: var(--fi-mono);
      font-size: var(--fi-font-xs);
      color: var(--bn-t1);
      background: var(--bn-bg2);
      border: 1px solid var(--bn-border);
      border-radius: 3px;
      padding: 3px 8px;
      cursor: pointer;
      transition: background 150ms ease;
      letter-spacing: 0.03em;
    }
    .theme-toggle:hover {
      background: var(--bn-bg3);
      color: var(--bn-t0);
    }

    /* ── Content Area ── */
    .content-area {
      flex: 1;
      overflow: hidden;
    }
  `],
})
export class App {
  private platformId = inject(PLATFORM_ID);

  tabs = [
    { label: 'Trade', route: '/trade' },
    { label: 'Prices', route: '/prices' },
    { label: 'Risk', route: '/risk' },
    { label: 'Market', route: '/market' },
    { label: 'Research', route: '/research' },
    { label: 'Orders', route: '/orders' },
    { label: 'Analytics', route: '/analytics' },
  ];

  tickerStrip: TickerItem[] = TICKER_STRIP;
  isDark = signal(true);

  constructor() {
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        document.documentElement.setAttribute(
          'data-theme',
          this.isDark() ? 'dark' : 'light'
        );
      }
    });
  }

  toggleTheme() {
    this.isDark.update((v) => !v);
  }
}
