import { SparePart, StockTransaction, TransactionType } from '../types/inventory';

export async function apiGetParts(): Promise<SparePart[]> {
  try {
    const res = await fetch('/api/parts');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.parts || [];
  } catch (err) {
    console.warn('API error fetching parts, falling back to local storage:', err);
    throw err;
  }
}

export async function apiAddPart(part: Omit<SparePart, 'id' | 'lastUpdated'>): Promise<SparePart> {
  const res = await fetch('/api/parts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(part),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.part;
}

export async function apiUpdatePart(id: string, updates: Partial<SparePart>): Promise<SparePart> {
  const res = await fetch(`/api/parts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.part;
}

export async function apiDeletePart(id: string): Promise<void> {
  const res = await fetch(`/api/parts/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function apiBatchDelete(ids: string[]): Promise<void> {
  const res = await fetch('/api/parts/batch-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function apiAdjustStock(params: {
  partId: string;
  type: TransactionType;
  quantityChange: number;
  reason: string;
  technician?: string;
  workOrder?: string;
}): Promise<{ part: SparePart; transaction: StockTransaction }> {
  const res = await fetch('/api/parts/adjust', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function apiGetTransactions(): Promise<StockTransaction[]> {
  try {
    const res = await fetch('/api/transactions');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.transactions || [];
  } catch (err) {
    console.warn('API error fetching transactions:', err);
    throw err;
  }
}

export async function apiImportParts(parts: SparePart[], mode: 'merge' | 'replace'): Promise<SparePart[]> {
  const res = await fetch('/api/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parts, mode }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.parts || [];
}

export async function apiFetchSpreadsheetUrl(url: string): Promise<string> {
  const res = await fetch('/api/fetch-spreadsheet-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data.csvText;
}
