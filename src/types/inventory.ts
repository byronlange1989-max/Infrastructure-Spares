export type ComponentCategory =
  | 'Mechanical'
  | 'Electrical'
  | 'Pneumatics & Hydraulics'
  | 'Sensors & Instrumentation'
  | 'Fasteners & Hardware'
  | 'Belts & Pulleys'
  | 'Bearings & Seals'
  | 'Motors & Drives'
  | 'Filters & Lubricants'
  | 'General Spares';

export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export type CriticalityLevel = 'High' | 'Medium' | 'Low';

export interface SparePart {
  id: string;
  partNumber: string;
  name: string;
  category: ComponentCategory;
  quantity: number;
  minStock: number;
  unit: string;
  location: string;
  unitCost: number;
  supplier: string;
  equipment: string;
  criticality: CriticalityLevel;
  notes?: string;
  specs?: string;
  lastUpdated: string;
}

export type TransactionType = 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'PART_ADDED' | 'PART_REMOVED';

export interface StockTransaction {
  id: string;
  partId: string;
  partNumber: string;
  partName: string;
  type: TransactionType;
  quantityChange: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  technician?: string;
  workOrder?: string;
  timestamp: string;
}

export interface SpreadsheetColumnMap {
  partNumber: string;
  name: string;
  category?: string;
  quantity: string;
  minStock?: string;
  unit?: string;
  location?: string;
  unitCost?: string;
  supplier?: string;
  equipment?: string;
  criticality?: string;
  notes?: string;
}
