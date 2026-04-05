import { Injectable, signal } from '@angular/core';
import { type Bond, type RfqRequest, type Order, BONDS, INITIAL_ORDERS, RESEARCH_NOTES, type ResearchNote } from './trading-data.service';

@Injectable({ providedIn: 'root' })
export class SharedStateService {
  selectedBond = signal<Bond>(BONDS[0]);
  rfqRequests = signal<RfqRequest[]>([]);
  showRfq = signal(false);
  clickedPrice = signal<number | undefined>(undefined);

  // Orders tab shared state
  orders = signal<Order[]>([...INITIAL_ORDERS]);
  selectedOrder = signal<Order | null>(null);
  orderFilter = signal('All');

  // Research tab shared state
  selectedNote = signal<ResearchNote>(RESEARCH_NOTES[0]);
  researchFilter = signal('All');
}
