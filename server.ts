import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const DATA_DIR = path.resolve(__dirname, 'data');
const INVENTORY_FILE = path.join(DATA_DIR, 'inventory.json');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(INVENTORY_FILE)) {
  fs.writeFileSync(INVENTORY_FILE, JSON.stringify([], null, 2), 'utf-8');
}
if (!fs.existsSync(TRANSACTIONS_FILE)) {
  fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify([], null, 2), 'utf-8');
}

// Helpers for data persistence
function readInventory(): any[] {
  try {
    const raw = fs.readFileSync(INVENTORY_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading inventory:', err);
    return [];
  }
}

function writeInventory(data: any[]): void {
  try {
    fs.writeFileSync(INVENTORY_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing inventory:', err);
  }
}

function readTransactions(): any[] {
  try {
    const raw = fs.readFileSync(TRANSACTIONS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading transactions:', err);
    return [];
  }
}

function writeTransactions(data: any[]): void {
  try {
    fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing transactions:', err);
  }
}

// Middleware
app.use(express.json({ limit: '20mb' }));

// --- REST API ROUTES ---

// 1. Get all spare parts
app.get('/api/parts', (req, res) => {
  const parts = readInventory();
  res.json({ success: true, parts });
});

// 2. Add a new spare part
app.post('/api/parts', (req, res) => {
  const newPart = req.body;
  if (!newPart || !newPart.partNumber || !newPart.name) {
    return res.status(400).json({ success: false, error: 'Part number and name are required' });
  }

  const parts = readInventory();
  const id = newPart.id || `sp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const timestamp = new Date().toISOString();

  const partToSave = {
    ...newPart,
    id,
    lastUpdated: timestamp,
  };

  const updatedParts = [partToSave, ...parts];
  writeInventory(updatedParts);

  // Record audit transaction
  const tx = {
    id: `tx-${Date.now()}`,
    partId: id,
    partNumber: partToSave.partNumber,
    partName: partToSave.name,
    type: 'PART_ADDED',
    quantityChange: partToSave.quantity || 0,
    previousQuantity: 0,
    newQuantity: partToSave.quantity || 0,
    reason: 'Component added to server inventory',
    technician: req.body.technician || 'Server Admin',
    timestamp,
  };
  const txs = readTransactions();
  writeTransactions([tx, ...txs]);

  res.json({ success: true, part: partToSave });
});

// 3. Update an existing spare part
app.put('/api/parts/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const parts = readInventory();
  const index = parts.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Component not found' });
  }

  const oldPart = parts[index];
  const timestamp = new Date().toISOString();
  const updatedPart = {
    ...oldPart,
    ...updates,
    id,
    lastUpdated: timestamp,
  };

  parts[index] = updatedPart;
  writeInventory(parts);

  // If quantity changed, log adjustment
  if (oldPart.quantity !== updatedPart.quantity) {
    const diff = updatedPart.quantity - oldPart.quantity;
    const tx = {
      id: `tx-${Date.now()}`,
      partId: id,
      partNumber: updatedPart.partNumber,
      partName: updatedPart.name,
      type: 'ADJUSTMENT',
      quantityChange: diff,
      previousQuantity: oldPart.quantity,
      newQuantity: updatedPart.quantity,
      reason: 'Component edited on server',
      technician: updates.technician || 'Admin',
      timestamp,
    };
    const txs = readTransactions();
    writeTransactions([tx, ...txs]);
  }

  res.json({ success: true, part: updatedPart });
});

// 4. Delete a spare part
app.delete('/api/parts/:id', (req, res) => {
  const { id } = req.params;
  const parts = readInventory();
  const partToDelete = parts.find((p) => p.id === id);

  if (!partToDelete) {
    return res.status(404).json({ success: false, error: 'Component not found' });
  }

  const updatedParts = parts.filter((p) => p.id !== id);
  writeInventory(updatedParts);

  const timestamp = new Date().toISOString();
  const tx = {
    id: `tx-${Date.now()}`,
    partId: id,
    partNumber: partToDelete.partNumber,
    partName: partToDelete.name,
    type: 'PART_REMOVED',
    quantityChange: -partToDelete.quantity,
    previousQuantity: partToDelete.quantity,
    newQuantity: 0,
    reason: `Component ${partToDelete.partNumber} deleted from server catalog`,
    technician: 'Server Admin',
    timestamp,
  };
  const txs = readTransactions();
  writeTransactions([tx, ...txs]);

  res.json({ success: true, removedPart: partToDelete });
});

// 5. Batch delete spare parts
app.post('/api/parts/batch-delete', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, error: 'Array of ids required' });
  }

  const parts = readInventory();
  const updatedParts = parts.filter((p) => !ids.includes(p.id));
  writeInventory(updatedParts);

  const timestamp = new Date().toISOString();
  const tx = {
    id: `tx-${Date.now()}`,
    partId: 'batch',
    partNumber: 'BATCH-DELETE',
    partName: `${ids.length} components removed in batch`,
    type: 'PART_REMOVED',
    quantityChange: 0,
    previousQuantity: 0,
    newQuantity: 0,
    reason: `Batch deletion of ${ids.length} components on server`,
    technician: 'Server Admin',
    timestamp,
  };
  const txs = readTransactions();
  writeTransactions([tx, ...txs]);

  res.json({ success: true, count: ids.length });
});

// 6. Stock Adjustment (Stock In / Stock Out)
app.post('/api/parts/adjust', (req, res) => {
  const { partId, type, quantityChange, reason, technician, workOrder } = req.body;

  if (!partId || typeof quantityChange !== 'number') {
    return res.status(400).json({ success: false, error: 'partId and numeric quantityChange required' });
  }

  const parts = readInventory();
  const index = parts.findIndex((p) => p.id === partId);

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Component not found' });
  }

  const current = parts[index];
  const newQuantity = Math.max(0, current.quantity + quantityChange);
  const timestamp = new Date().toISOString();

  parts[index] = {
    ...current,
    quantity: newQuantity,
    lastUpdated: timestamp,
  };
  writeInventory(parts);

  const tx = {
    id: `tx-${Date.now()}`,
    partId,
    partNumber: current.partNumber,
    partName: current.name,
    type: type || (quantityChange > 0 ? 'STOCK_IN' : 'STOCK_OUT'),
    quantityChange,
    previousQuantity: current.quantity,
    newQuantity,
    reason: reason || (quantityChange > 0 ? 'Stock received' : 'Stock issued'),
    technician: technician || 'Storekeeper',
    workOrder: workOrder || '',
    timestamp,
  };
  const txs = readTransactions();
  writeTransactions([tx, ...txs]);

  res.json({ success: true, part: parts[index], transaction: tx });
});

// 7. Get Transactions history
app.get('/api/transactions', (req, res) => {
  const txs = readTransactions();
  res.json({ success: true, transactions: txs });
});

// 8. Import (replace or merge)
app.post('/api/import', (req, res) => {
  const { parts: importedParts, mode } = req.body;

  if (!Array.isArray(importedParts)) {
    return res.status(400).json({ success: false, error: 'Array of parts required' });
  }

  const timestamp = new Date().toISOString();
  let finalParts: any[] = [];

  if (mode === 'replace') {
    finalParts = importedParts;
  } else {
    // merge
    const current = readInventory();
    const existingMap = new Map(current.map((p) => [p.partNumber.toLowerCase(), p]));
    finalParts = [...current];

    importedParts.forEach((imp: any) => {
      const match = existingMap.get(imp.partNumber.toLowerCase());
      if (match) {
        const idx = finalParts.findIndex((p) => p.id === match.id);
        if (idx !== -1) {
          finalParts[idx] = {
            ...match,
            quantity: imp.quantity,
            minStock: imp.minStock,
            unitCost: imp.unitCost || match.unitCost,
            location: imp.location !== 'Unassigned' ? imp.location : match.location,
            lastUpdated: timestamp,
          };
        }
      } else {
        finalParts.push(imp);
      }
    });
  }

  writeInventory(finalParts);

  // Log transaction
  const tx = {
    id: `tx-${Date.now()}`,
    partId: 'import',
    partNumber: 'IMPORT-SYNC',
    partName: `${importedParts.length} components synced via server`,
    type: 'PART_ADDED',
    quantityChange: importedParts.reduce((a: number, b: any) => a + (b.quantity || 0), 0),
    previousQuantity: 0,
    newQuantity: finalParts.length,
    reason: `Spreadsheet sync (${mode === 'replace' ? 'Replace' : 'Merge'}) on server`,
    technician: 'Server Import API',
    timestamp,
  };
  const txs = readTransactions();
  writeTransactions([tx, ...txs]);

  res.json({ success: true, parts: finalParts, count: finalParts.length });
});

// 9. Server-side fetch of external spreadsheet link (CORS bypass!)
app.post('/api/fetch-spreadsheet-url', async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }

  try {
    let targetUrl = url.trim();

    // Transform Google Sheets URLs if needed
    const gsheetMatch = targetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (gsheetMatch) {
      const sheetId = gsheetMatch[1];
      const gidMatch = targetUrl.match(/[#&?]gid=([0-9]+)/);
      const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '';
      targetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}`;
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `Remote spreadsheet returned HTTP ${response.status}`,
      });
    }

    const text = await response.text();

    if (text.includes('<!DOCTYPE html>') && text.includes('accounts.google.com')) {
      return res.status(403).json({
        success: false,
        error:
          'This Google Sheet requires Google account login. Please set share settings to "Anyone with the link can view", or use File -> Share -> Publish to web -> CSV.',
      });
    }

    res.json({ success: true, csvText: text });
  } catch (err: any) {
    console.error('Server fetch spreadsheet error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch spreadsheet' });
  }
});

// --- SERVER INITIALIZATION (DEV VS PROD) ---
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Development mode: Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Infrastructure Spares Server running on http://0.0.0.0:${PORT} [${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server start error:', err);
  process.exit(1);
});
