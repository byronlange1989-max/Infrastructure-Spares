import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { SparePart, ComponentCategory, SpreadsheetColumnMap } from '../types/inventory';

// Normalize header text for fuzzy matching
export function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Auto-detect column mapping from spreadsheet headers
export function detectColumnMapping(headers: string[]): SpreadsheetColumnMap {
  const map: SpreadsheetColumnMap = {
    partNumber: '',
    name: '',
    quantity: '',
  };

  for (const h of headers) {
    const norm = normalizeHeader(h);

    if (!map.partNumber && (norm.includes('partno') || norm.includes('partnum') || norm.includes('sku') || norm.includes('itemcode') || norm.includes('code') || norm === 'part' || norm === 'id')) {
      map.partNumber = h;
    } else if (!map.name && (norm.includes('name') || norm.includes('desc') || norm.includes('title') || norm.includes('component') || norm.includes('itemname'))) {
      map.name = h;
    } else if (!map.quantity && (norm.includes('qty') || norm.includes('quant') || norm.includes('stock') || norm.includes('count') || norm.includes('onhand'))) {
      map.quantity = h;
    } else if (!map.minStock && (norm.includes('min') || norm.includes('reorder') || norm.includes('threshold') || norm.includes('safetystock'))) {
      map.minStock = h;
    } else if (!map.category && (norm.includes('cat') || norm.includes('group') || norm.includes('type') || norm.includes('system') || norm.includes('dept'))) {
      map.category = h;
    } else if (!map.location && (norm.includes('loc') || norm.includes('bin') || norm.includes('shelf') || norm.includes('rack') || norm.includes('aisle') || norm.includes('bay'))) {
      map.location = h;
    } else if (!map.unitCost && (norm.includes('cost') || norm.includes('price') || norm.includes('unitprice') || norm.includes('rate') || norm.includes('value'))) {
      map.unitCost = h;
    } else if (!map.unit && (norm.includes('unit') || norm.includes('uom') || norm.includes('measure'))) {
      map.unit = h;
    } else if (!map.supplier && (norm.includes('supp') || norm.includes('vend') || norm.includes('maker') || norm.includes('brand') || norm.includes('mfg'))) {
      map.supplier = h;
    } else if (!map.equipment && (norm.includes('equip') || norm.includes('mach') || norm.includes('asset') || norm.includes('line') || norm.includes('station'))) {
      map.equipment = h;
    } else if (!map.criticality && (norm.includes('crit') || norm.includes('prio') || norm.includes('urgenc'))) {
      map.criticality = h;
    } else if (!map.notes && (norm.includes('note') || norm.includes('remark') || norm.includes('comment') || norm.includes('spec'))) {
      map.notes = h;
    }
  }

  // Fallbacks if not detected
  if (!map.partNumber && headers.length > 0) map.partNumber = headers[0];
  if (!map.name && headers.length > 1) map.name = headers[1];
  if (!map.quantity && headers.length > 2) map.quantity = headers[2];

  return map;
}

// Convert a Google Sheets URL or generic URL to a fetchable CSV URL
export function convertGoogleSheetUrlToCsv(rawUrl: string): string {
  let url = rawUrl.trim();

  // If user pasted a Google Sheets URL (e.g. https://docs.google.com/spreadsheets/d/{ID}/edit#gid=0)
  const gsheetMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (gsheetMatch) {
    const sheetId = gsheetMatch[1];
    // Check if gid is present
    const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
    const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '';
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}`;
  }

  return url;
}

// Parse CSV text into row objects and headers
export function parseCsvText(csvText: string): { headers: string[]; rows: Record<string, any>[] } {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
  });

  const headers = result.meta.fields || [];
  const rows = (result.data as Record<string, any>[]).filter((row) =>
    Object.values(row).some((val) => val !== null && val !== undefined && String(val).trim() !== '')
  );

  return { headers, rows };
}

// Parse Excel ArrayBuffer into row objects and headers
export function parseExcelBuffer(buffer: ArrayBuffer): { headers: string[]; rows: Record<string, any>[] } {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to JSON with headers
  const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
  if (jsonData.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = Object.keys(jsonData[0]);
  return { headers, rows: jsonData };
}

// Map parsed spreadsheet rows to SparePart objects
export function mapRowsToSpareParts(
  rows: Record<string, any>[],
  columnMap: SpreadsheetColumnMap
): { validParts: SparePart[]; errors: string[] } {
  const validParts: SparePart[] = [];
  const errors: string[] = [];
  const timestamp = new Date().toISOString();

  rows.forEach((row, index) => {
    const rowNum = index + 2; // account for header
    const rawPartNumber = row[columnMap.partNumber] ? String(row[columnMap.partNumber]).trim() : '';
    const rawName = row[columnMap.name] ? String(row[columnMap.name]).trim() : '';

    if (!rawPartNumber && !rawName) {
      // empty row
      return;
    }

    const partNumber = rawPartNumber || `PART-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const name = rawName || `Component ${partNumber}`;

    const rawQty = columnMap.quantity ? row[columnMap.quantity] : 0;
    const qtyParsed = parseFloat(String(rawQty).replace(/[^0-9.-]/g, ''));
    const quantity = isNaN(qtyParsed) ? 0 : Math.max(0, qtyParsed);

    const rawMin = columnMap.minStock ? row[columnMap.minStock] : 0;
    const minParsed = parseFloat(String(rawMin).replace(/[^0-9.-]/g, ''));
    const minStock = isNaN(minParsed) ? 5 : Math.max(0, minParsed);

    const rawCost = columnMap.unitCost ? row[columnMap.unitCost] : 0;
    const costParsed = parseFloat(String(rawCost).replace(/[^0-9.-]/g, ''));
    const unitCost = isNaN(costParsed) ? 0 : Math.max(0, costParsed);

    const categoryRaw = columnMap.category ? String(row[columnMap.category] || '').trim() : 'General Spares';
    const category = sanitizeCategory(categoryRaw);

    const criticalityRaw = columnMap.criticality ? String(row[columnMap.criticality] || '').toLowerCase() : 'medium';
    const criticality = criticalityRaw.includes('high') ? 'High' : criticalityRaw.includes('low') ? 'Low' : 'Medium';

    const part: SparePart = {
      id: `sp-import-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      partNumber,
      name,
      category,
      quantity,
      minStock,
      unit: columnMap.unit && row[columnMap.unit] ? String(row[columnMap.unit]).trim() : 'pcs',
      location: columnMap.location && row[columnMap.location] ? String(row[columnMap.location]).trim() : 'Unassigned',
      unitCost,
      supplier: columnMap.supplier && row[columnMap.supplier] ? String(row[columnMap.supplier]).trim() : 'Generic Supplier',
      equipment: columnMap.equipment && row[columnMap.equipment] ? String(row[columnMap.equipment]).trim() : 'General Plant',
      criticality,
      notes: columnMap.notes && row[columnMap.notes] ? String(row[columnMap.notes]).trim() : '',
      lastUpdated: timestamp,
    };

    validParts.push(part);
  });

  return { validParts, errors };
}

function sanitizeCategory(val: string): ComponentCategory {
  const norm = val.toLowerCase();
  if (norm.includes('mech')) return 'Mechanical';
  if (norm.includes('elec') || norm.includes('fuse') || norm.includes('relay')) return 'Electrical';
  if (norm.includes('pneu') || norm.includes('hydr') || norm.includes('valve') || norm.includes('cyl')) return 'Pneumatics & Hydraulics';
  if (norm.includes('sens') || norm.includes('probe') || norm.includes('switch') || norm.includes('optic')) return 'Sensors & Instrumentation';
  if (norm.includes('fast') || norm.includes('bolt') || norm.includes('nut') || norm.includes('screw')) return 'Fasteners & Hardware';
  if (norm.includes('belt') || norm.includes('pulley') || norm.includes('chain')) return 'Belts & Pulleys';
  if (norm.includes('bear') || norm.includes('seal') || norm.includes('o-ring')) return 'Bearings & Seals';
  if (norm.includes('motor') || norm.includes('drive') || norm.includes('vfd') || norm.includes('gear')) return 'Motors & Drives';
  if (norm.includes('filt') || norm.includes('oil') || norm.includes('grease') || norm.includes('lub')) return 'Filters & Lubricants';
  return 'General Spares';
}

// Export parts list to CSV string
export function exportToCsv(parts: SparePart[]): string {
  const formatted = parts.map((p) => ({
    'Part Number': p.partNumber,
    'Component Name': p.name,
    'Category': p.category,
    'Quantity On Hand': p.quantity,
    'Minimum Stock': p.minStock,
    'Unit': p.unit,
    'Location / Bin': p.location,
    'Unit Cost ($)': p.unitCost.toFixed(2),
    'Total Value ($)': (p.quantity * p.unitCost).toFixed(2),
    'Supplier / Vendor': p.supplier,
    'Equipment / Machine': p.equipment,
    'Criticality': p.criticality,
    'Notes / Specs': p.notes || p.specs || '',
    'Last Updated': p.lastUpdated,
  }));

  return Papa.unparse(formatted);
}

// Download CSV file to client
export function downloadCsvFile(csvContent: string, filename: string = 'spares_inventory.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export parts list to XLSX Excel file
export function exportToExcel(parts: SparePart[], filename: string = 'spares_inventory.xlsx') {
  const formatted = parts.map((p) => ({
    'Part Number': p.partNumber,
    'Component Name': p.name,
    'Category': p.category,
    'Quantity On Hand': p.quantity,
    'Minimum Stock': p.minStock,
    'Stock Status': p.quantity === 0 ? 'Out of Stock' : p.quantity <= p.minStock ? 'Low Stock' : 'In Stock',
    'Unit': p.unit,
    'Location / Bin': p.location,
    'Unit Cost ($)': p.unitCost,
    'Total Value ($)': Number((p.quantity * p.unitCost).toFixed(2)),
    'Supplier / Vendor': p.supplier,
    'Equipment / Machine': p.equipment,
    'Criticality': p.criticality,
    'Notes': p.notes || '',
    'Last Updated': p.lastUpdated,
  }));

  const worksheet = XLSX.utils.json_to_sheet(formatted);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Spares Inventory');
  XLSX.writeFile(workbook, filename);
}

// Generate sample template CSV
export function getSampleTemplateCsv(): string {
  const sample = [
    {
      'Part Number': 'BRG-6002-ZZ',
      'Component Name': 'Deep Groove Ball Bearing 15x32x9mm',
      'Category': 'Bearings & Seals',
      'Quantity': 25,
      'Min Stock': 8,
      'Unit': 'pcs',
      'Location': 'Aisle 2 - Shelf C1',
      'Unit Cost': 8.50,
      'Supplier': 'SKF Bearing Co',
      'Equipment': 'Drive Pulley DP-01',
      'Criticality': 'High',
      'Notes': 'Shielded both sides, high temp grease',
    },
    {
      'Part Number': 'PROX-M12-NC',
      'Component Name': 'Proximity Sensor Inductive M12 PNP NC',
      'Category': 'Sensors & Instrumentation',
      'Quantity': 4,
      'Min Stock': 4,
      'Unit': 'pcs',
      'Location': 'Cabinet E3 - Bin 12',
      'Unit Cost': 38.00,
      'Supplier': 'Omron Electronics',
      'Equipment': 'Index Cam Station',
      'Criticality': 'Medium',
      'Notes': 'Flush mount 4mm sensing distance',
    },
    {
      'Part Number': 'O-RING-VITON-30X3',
      'Component Name': 'Viton O-Ring 30mm ID x 3mm Cross Section',
      'Category': 'Bearings & Seals',
      'Quantity': 60,
      'Min Stock': 20,
      'Unit': 'pcs',
      'Location': 'Bin Wall B-04',
      'Unit Cost': 1.25,
      'Supplier': 'Parker Hannifin',
      'Equipment': 'Hydraulic Pump Manifold',
      'Criticality': 'Low',
      'Notes': 'FKM Fluoroelastomer, 200°C resistant',
    }
  ];
  return Papa.unparse(sample);
}
