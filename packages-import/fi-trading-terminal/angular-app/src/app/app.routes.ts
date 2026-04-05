import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'trade', pathMatch: 'full' },
  {
    path: 'trade',
    loadComponent: () =>
      import('./components/trade/trade.component').then((m) => m.TradeComponent),
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./components/orders/orders.component').then((m) => m.OrdersComponent),
  },
  // Placeholder routes for other tabs
  {
    path: 'prices',
    loadComponent: () =>
      import('./components/trade/trade.component').then((m) => m.TradeComponent),
  },
  {
    path: 'risk',
    loadComponent: () =>
      import('./components/placeholder/placeholder.component').then((m) => m.PlaceholderComponent),
    data: { title: 'Risk' },
  },
  {
    path: 'market',
    loadComponent: () =>
      import('./components/placeholder/placeholder.component').then((m) => m.PlaceholderComponent),
    data: { title: 'Market' },
  },
  {
    path: 'research',
    loadComponent: () =>
      import('./components/placeholder/placeholder.component').then((m) => m.PlaceholderComponent),
    data: { title: 'Research' },
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./components/placeholder/placeholder.component').then((m) => m.PlaceholderComponent),
    data: { title: 'Analytics' },
  },
];
