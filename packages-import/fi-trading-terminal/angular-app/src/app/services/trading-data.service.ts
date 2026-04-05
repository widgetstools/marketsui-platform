import { Injectable } from '@angular/core';

// ── Interfaces ──

export interface Bond {
  id: string;
  ticker: string;
  issuer: string;
  cpn: number;
  mat: string;
  cusip: string;
  rtg: string;
  rtgClass: 'aaa' | 'aa' | 'a' | 'bbb' | 'hy';
  sector: string;
  seniority: string;
  bid: number;
  ask: number;
  ytm: number;
  ytw: number;
  oas: number;
  gSpd: number;
  dur: number;
  dv01: number;
  cvx: number;
  face: string;
  side: 'Buy' | 'Sell';
  axes: string;
}

export interface Order {
  id: string;
  time: string;
  bond: string;
  side: string;
  qty: string;
  type: string;
  px: number;
  ytm: number;
  status: 'Filled' | 'Partial' | 'Pending' | 'Cancelled';
  filled: string;
}

export interface TickerItem {
  label: string;
  value: string;
  change: string;
  up: boolean;
}

// ── Data ──

export const BONDS: Bond[] = [
  { id: 'b1', ticker: 'UST', issuer: 'US Treasury', cpn: 4.625, mat: '06/26', cusip: '912828ZT0', rtg: 'Aaa', rtgClass: 'aaa', sector: 'Government', seniority: 'Sovereign', bid: 100.072, ask: 100.197, ytm: 4.52, ytw: 4.52, oas: 0, gSpd: 8, dur: 1.85, dv01: 185, cvx: 0.04, face: '10MM', side: 'Buy', axes: '0B/00' },
  { id: 'b2', ticker: 'UST', issuer: 'US Treasury', cpn: 4.5, mat: '09/27', cusip: '912828CHT1', rtg: 'Aaa', rtgClass: 'aaa', sector: 'Government', seniority: 'Sovereign', bid: 99.933, ask: 100.058, ytm: 4.55, ytw: 4.55, oas: 0, gSpd: 12, dur: 2.82, dv01: 282, cvx: 0.09, face: '15MM', side: 'Buy', axes: '0B/00' },
  { id: 'b3', ticker: 'UST', issuer: 'US Treasury', cpn: 4.25, mat: '03/29', cusip: '912828CJN2', rtg: 'Aaa', rtgClass: 'aaa', sector: 'Government', seniority: 'Sovereign', bid: 99.241, ask: 99.366, ytm: 4.38, ytw: 4.38, oas: 0, gSpd: 18, dur: 4.52, dv01: 452, cvx: 0.22, face: '8MM', side: 'Sell', axes: '0B/00' },
  { id: 'b4', ticker: 'UST', issuer: 'US Treasury', cpn: 4.0, mat: '02/31', cusip: '912828CKR2', rtg: 'Aaa', rtgClass: 'aaa', sector: 'Government', seniority: 'Sovereign', bid: 98.587, ask: 98.712, ytm: 4.25, ytw: 4.25, oas: 0, gSpd: 22, dur: 6.21, dv01: 621, cvx: 0.42, face: '12MM', side: 'Buy', axes: '0B/00' },
  { id: 'b5', ticker: 'UST', issuer: 'US Treasury', cpn: 4.375, mat: '05/34', cusip: '912810TM0', rtg: 'Aaa', rtgClass: 'aaa', sector: 'Government', seniority: 'Sovereign', bid: 97.85, ask: 97.975, ytm: 4.6, ytw: 4.6, oas: 0, gSpd: 35, dur: 8.45, dv01: 845, cvx: 0.78, face: '5MM', side: 'Buy', axes: '0B/00' },
  { id: 'b6', ticker: 'UST', issuer: 'US Treasury', cpn: 4.75, mat: '02/54', cusip: '912810TV0', rtg: 'Aaa', rtgClass: 'aaa', sector: 'Government', seniority: 'Sovereign', bid: 96.799, ask: 97.049, ytm: 4.95, ytw: 4.95, oas: 0, gSpd: 42, dur: 17.2, dv01: 1720, cvx: 4.12, face: '3MM', side: 'Sell', axes: '0B/00' },
  { id: 'b7', ticker: 'AAPL', issuer: 'Apple Inc', cpn: 2.05, mat: '09/26', cusip: '037833AK6', rtg: 'Aa1', rtgClass: 'aa', sector: 'Technology', seniority: 'Sr Unsec', bid: 98.861, ask: 98.986, ytm: 2.35, ytw: 2.35, oas: 18, gSpd: 15, dur: 0.42, dv01: 42, cvx: 0.01, face: '5MM', side: 'Buy', axes: '5B/00' },
  { id: 'b8', ticker: 'AAPL', issuer: 'Apple Inc', cpn: 3.25, mat: '02/29', cusip: '037833DV8', rtg: 'Aa1', rtgClass: 'aa', sector: 'Technology', seniority: 'Sr Unsec', bid: 99.232, ask: 99.482, ytm: 3.42, ytw: 3.42, oas: 65, gSpd: 52, dur: 2.68, dv01: 268, cvx: 0.08, face: '8MM', side: 'Buy', axes: '8B/00' },
  { id: 'b9', ticker: 'AAPL', issuer: 'Apple Inc', cpn: 4.1, mat: '08/42', cusip: '037833EQ8', rtg: 'Aa1', rtgClass: 'aa', sector: 'Technology', seniority: 'Sr Unsec', bid: 93.933, ask: 94.183, ytm: 4.32, ytw: 4.32, oas: 132, gSpd: 118, dur: 12.5, dv01: 1250, cvx: 2.15, face: '3MM', side: 'Sell', axes: '00/3S' },
  { id: 'b10', ticker: 'JPM', issuer: 'JPMorgan Chase', cpn: 4.5, mat: '01/27', cusip: '46647PBY1', rtg: 'A2', rtgClass: 'a', sector: 'Financials', seniority: 'Sr Unsec', bid: 101.315, ask: 101.565, ytm: 3.85, ytw: 3.85, oas: 58, gSpd: 45, dur: 0.78, dv01: 78, cvx: 0.01, face: '10MM', side: 'Buy', axes: '10B/00' },
  { id: 'b11', ticker: 'JPM', issuer: 'JPMorgan Chase', cpn: 5.04, mat: '01/31', cusip: '46647PCR5', rtg: 'A2', rtgClass: 'a', sector: 'Financials', seniority: 'Sr Unsec', bid: 102.32, ask: 102.57, ytm: 4.65, ytw: 4.65, oas: 98, gSpd: 82, dur: 4.12, dv01: 412, cvx: 0.19, face: '6MM', side: 'Buy', axes: '6B/6S' },
  { id: 'b12', ticker: 'JPM', issuer: 'JPMorgan Chase', cpn: 5.35, mat: '06/35', cusip: '46647PCX2', rtg: 'A2', rtgClass: 'a', sector: 'Financials', seniority: 'Sr Unsec', bid: 99.574, ask: 99.824, ytm: 5.12, ytw: 5.12, oas: 125, gSpd: 108, dur: 7.85, dv01: 785, cvx: 0.72, face: '4MM', side: 'Sell', axes: '00/4S' },
  { id: 'b13', ticker: 'MSFT', issuer: 'Microsoft Corp', cpn: 2.4, mat: '08/27', cusip: '594918CE2', rtg: 'Aaa', rtgClass: 'aaa', sector: 'Technology', seniority: 'Sr Unsec', bid: 99.159, ask: 99.284, ytm: 2.78, ytw: 2.78, oas: 22, gSpd: 18, dur: 1.28, dv01: 128, cvx: 0.02, face: '7MM', side: 'Buy', axes: '7B/00' },
  { id: 'b14', ticker: 'MSFT', issuer: 'Microsoft Corp', cpn: 3.45, mat: '08/36', cusip: '594918BX1', rtg: 'Aaa', rtgClass: 'aaa', sector: 'Technology', seniority: 'Sr Unsec', bid: 96.433, ask: 96.683, ytm: 3.82, ytw: 3.82, oas: 85, gSpd: 72, dur: 8.92, dv01: 892, cvx: 0.92, face: '4MM', side: 'Sell', axes: '00/4S' },
  { id: 'b15', ticker: 'JNJ', issuer: 'Johnson & Johnson', cpn: 3.4, mat: '01/29', cusip: '478160BW5', rtg: 'Aa3', rtgClass: 'aa', sector: 'Healthcare', seniority: 'Sr Unsec', bid: 99.892, ask: 100.142, ytm: 3.62, ytw: 3.62, oas: 48, gSpd: 38, dur: 2.55, dv01: 255, cvx: 0.07, face: '6MM', side: 'Buy', axes: '6B/00' },
  { id: 'b16', ticker: 'PG', issuer: 'Procter & Gamble', cpn: 3.0, mat: '03/30', cusip: '742718GG2', rtg: 'Aa3', rtgClass: 'aa', sector: 'Consumer', seniority: 'Sr Unsec', bid: 98.036, ask: 98.286, ytm: 3.45, ytw: 3.45, oas: 52, gSpd: 42, dur: 3.82, dv01: 382, cvx: 0.16, face: '5MM', side: 'Sell', axes: '00/5S' },
  { id: 'b17', ticker: 'BAC', issuer: 'Bank of America', cpn: 5.2, mat: '04/29', cusip: '060505HN5', rtg: 'A2', rtgClass: 'a', sector: 'Financials', seniority: 'Sr Unsec', bid: 101.445, ask: 101.695, ytm: 4.82, ytw: 4.82, oas: 108, gSpd: 95, dur: 3.95, dv01: 395, cvx: 0.18, face: '8MM', side: 'Buy', axes: '8B/4S' },
  { id: 'b18', ticker: 'GS', issuer: 'Goldman Sachs', cpn: 5.8, mat: '03/32', cusip: '38141GZD1', rtg: 'Baa1', rtgClass: 'bbb', sector: 'Financials', seniority: 'Sr Unsec', bid: 103.22, ask: 103.47, ytm: 5.34, ytw: 5.34, oas: 155, gSpd: 138, dur: 5.82, dv01: 582, cvx: 0.38, face: '5MM', side: 'Sell', axes: '00/5S' },
  { id: 'b19', ticker: 'T', issuer: 'AT&T Inc', cpn: 4.35, mat: '06/29', cusip: '00206RDM4', rtg: 'Baa2', rtgClass: 'bbb', sector: 'Telecom', seniority: 'Sr Unsec', bid: 99.182, ask: 99.432, ytm: 4.48, ytw: 4.48, oas: 118, gSpd: 104, dur: 4.28, dv01: 428, cvx: 0.22, face: '4MM', side: 'Buy', axes: '4B/00' },
  { id: 'b20', ticker: 'F', issuer: 'Ford Motor Credit', cpn: 6.125, mat: '03/29', cusip: '345397BE1', rtg: 'Ba2', rtgClass: 'hy', sector: 'Consumer', seniority: 'Sr Unsec', bid: 98.05, ask: 98.8, ytm: 6.44, ytw: 6.44, oas: 298, gSpd: 285, dur: 3.92, dv01: 392, cvx: 0.19, face: '3MM', side: 'Buy', axes: '3B/3S' },
];

export const INITIAL_ORDERS: Order[] = [
  { id: 'o1', time: '14:35', bond: 'JPM 5.04 01/31', side: 'Buy', qty: '$6MM', type: 'RFQ', px: 102.32, ytm: 4.65, status: 'Filled', filled: '$6MM' },
  { id: 'o2', time: '14:28', bond: 'AAPL 3.25 02/29', side: 'Sell', qty: '$3MM', type: 'RFQ', px: 99.241, ytm: 3.42, status: 'Filled', filled: '$3MM' },
  { id: 'o3', time: '14:15', bond: 'UST 4.375 05/34', side: 'Buy', qty: '$10MM', type: 'RFQ', px: 97.85, ytm: 4.6, status: 'Filled', filled: '$10MM' },
  { id: 'o4', time: '14:02', bond: 'MSFT 2.40 08/27', side: 'Buy', qty: '$7MM', type: 'Limit', px: 99.15, ytm: 2.79, status: 'Partial', filled: '$2MM' },
  { id: 'o5', time: '13:58', bond: 'JNJ 3.40 01/29', side: 'Sell', qty: '$4MM', type: 'RFQ', px: 99.892, ytm: 3.62, status: 'Filled', filled: '$4MM' },
  { id: 'o6', time: '13:44', bond: 'UST 4.50 09/27', side: 'Buy', qty: '$15MM', type: 'RFQ', px: 99.933, ytm: 4.55, status: 'Filled', filled: '$15MM' },
  { id: 'o7', time: '13:30', bond: 'GS 5.80 03/32', side: 'Sell', qty: '$5MM', type: 'Limit', px: 103.2, ytm: 5.34, status: 'Pending', filled: '$0' },
  { id: 'o8', time: '13:15', bond: 'BAC 5.20 04/29', side: 'Buy', qty: '$8MM', type: 'RFQ', px: 0, ytm: 0, status: 'Cancelled', filled: '$0' },
];

export const TICKER_STRIP: TickerItem[] = [
  { label: 'UST 2Y', value: '4.68', change: '-0.01', up: false },
  { label: 'UST 3Y', value: '4.59', change: '+0.05', up: true },
  { label: 'UST 5Y', value: '4.29', change: '-0.11', up: false },
  { label: 'UST 7Y', value: '4.36', change: '+0.05', up: true },
  { label: 'UST 10Y', value: '4.27', change: '+0.07', up: true },
  { label: 'UST 20Y', value: '4.35', change: '-0.08', up: false },
  { label: 'UST 30Y', value: '4.41', change: '-0.09', up: false },
  { label: 'CDX IG', value: '52.90', change: '+0.20', up: true },
  { label: 'CDX HY', value: '339.59', change: '-4.81', up: false },
  { label: 'SOFR', value: '5.33', change: '0.00', up: true },
  { label: 'MOVE', value: '97.4', change: '-1.2', up: false },
];

@Injectable({ providedIn: 'root' })
export class TradingDataService {
  getBonds(): Bond[] {
    return BONDS;
  }

  getOrders(): Order[] {
    return INITIAL_ORDERS;
  }

  getTickerStrip(): TickerItem[] {
    return TICKER_STRIP;
  }

  getOrderKpis() {
    const orders = INITIAL_ORDERS;
    const filled = orders.filter((o) => o.status === 'Filled').length;
    const partial = orders.filter((o) => o.status === 'Partial').length;
    const pending = orders.filter((o) => o.status === 'Pending').length;
    const cancelled = orders.filter((o) => o.status === 'Cancelled').length;
    const totalNotional = orders
      .filter((o) => o.status === 'Filled' || o.status === 'Partial')
      .reduce((sum, o) => {
        const val = parseFloat(o.filled.replace(/[$MM,]/g, ''));
        return sum + (isNaN(val) ? 0 : val);
      }, 0);
    return { filled, partial, pending, cancelled, total: orders.length, totalNotional };
  }
}
