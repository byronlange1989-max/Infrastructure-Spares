import { SparePart, StockTransaction, ComponentCategory } from '../types/inventory';

// Clean initial state: only the user's components will be used
export const INITIAL_SPARE_PARTS: SparePart[] = [];

export const INITIAL_TRANSACTIONS: StockTransaction[] = [];

export const CATEGORIES: ComponentCategory[] = [
  'Mechanical',
  'Electrical',
  'Pneumatics & Hydraulics',
  'Sensors & Instrumentation',
  'Fasteners & Hardware',
  'Belts & Pulleys',
  'Bearings & Seals',
  'Motors & Drives',
  'Filters & Lubricants',
  'General Spares',
];
