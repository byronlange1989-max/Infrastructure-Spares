import { SparePart, StockTransaction } from '../types/inventory';
import { INITIAL_SPARE_PARTS, INITIAL_TRANSACTIONS } from '../data/initialData';

const STORAGE_KEYS = {
  PARTS: 'sparetrack_user_parts_v2',
  TRANSACTIONS: 'sparetrack_user_txs_v2',
};

export function loadSavedParts(): SparePart[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PARTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load parts from localStorage:', err);
  }
  return INITIAL_SPARE_PARTS;
}

export function saveParts(parts: SparePart[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.PARTS, JSON.stringify(parts));
  } catch (err) {
    console.error('Failed to save parts to localStorage:', err);
  }
}

export function loadSavedTransactions(): StockTransaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load transactions:', err);
  }
  return INITIAL_TRANSACTIONS;
}

export function saveTransactions(txs: StockTransaction[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
  } catch (err) {
    console.error('Failed to save transactions to localStorage:', err);
  }
}

export function resetToDefaultData(): { parts: SparePart[]; transactions: StockTransaction[] } {
  localStorage.removeItem(STORAGE_KEYS.PARTS);
  localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
  return {
    parts: [],
    transactions: [],
  };
}
