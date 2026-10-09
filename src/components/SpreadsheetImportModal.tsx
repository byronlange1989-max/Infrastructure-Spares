import React, { useState, useRef } from 'react';
import { 
  X, 
  Link2, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  Download, 
  HelpCircle,
  Sparkles,
  RefreshCw,
  FileText
} from 'lucide-react';
import { 
  convertGoogleSheetUrlToCsv, 
  parseCsvText, 
  parseExcelBuffer, 
  detectColumnMapping, 
  mapRowsToSpareParts,
  getSampleTemplateCsv,
  downloadCsvFile
} from '../utils/spreadsheet';
import { SparePart, SpreadsheetColumnMap } from '../types/inventory';
import { apiFetchSpreadsheetUrl } from '../utils/api';

interface SpreadsheetImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (importedParts: SparePart[], mode: 'merge' | 'replace') => void;
  initialTab?: 'link' | 'file';
}

export const SpreadsheetImportModal: React.FC<SpreadsheetImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  initialTab = 'link',
}) => {
  const [activeTab, setActiveTab] = useState<'link' | 'file' | 'paste'>(initialTab);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [rawPastedText, setRawPastedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step state: 'input' | 'mapping'
  const [step, setStep] = useState<'input' | 'mapping'>('input');

  // Parsed spreadsheet data
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, any>[]>([]);
  const [columnMap, setColumnMap] = useState<SpreadsheetColumnMap>({
    partNumber: '',
    name: '',
    quantity: '',
  });
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setStep('input');
    setParsedHeaders([]);
    setParsedRows([]);
    setErrorMessage(null);
    setIsLoading(false);
  };

  // 1. Process Google Sheet or CSV URL
  const handleFetchUrl = async () => {
    if (!spreadsheetUrl.trim()) {
      setErrorMessage('Please enter a spreadsheet URL or Google Sheets link');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      let text = '';
      try {
        // Try server-side fetch first (bypasses CORS)
        text = await apiFetchSpreadsheetUrl(spreadsheetUrl);
      } catch (serverErr: any) {
        console.warn('Server fetch attempt failed, trying client direct fetch:', serverErr);
        const csvUrl = convertGoogleSheetUrlToCsv(spreadsheetUrl);
        const response = await fetch(csvUrl);
        if (!response.ok) {
          throw new Error(`Failed to load file from URL (HTTP ${response.status})`);
        }
        text = await response.text();
      }

      if (!text || text.trim().length === 0) {
        throw new Error('Spreadsheet returned empty content');
      }

      // Check if it's an HTML error page (e.g. Google Drive sign-in wall)
      if (text.includes('<!DOCTYPE html>') && text.includes('accounts.google.com')) {
        throw new Error(
          'This Google Sheet requires permission. Please ensure the Google Sheet link is set to "Anyone with the link can view", or go to File -> Share -> Publish to web -> CSV.'
        );
      }

      const { headers, rows } = parseCsvText(text);
      if (rows.length === 0 || headers.length === 0) {
        throw new Error('No valid tabular rows detected in spreadsheet');
      }

      proceedToMapping(headers, rows);
    } catch (err: any) {
      console.error('Fetch spreadsheet error:', err);
      setErrorMessage(
        err.message || 'Could not fetch spreadsheet. Ensure it is publicly accessible or try downloading and uploading the file.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Process File Upload (.csv or .xlsx)
  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
        const text = await file.text();
        const { headers, rows } = parseCsvText(text);
        if (rows.length === 0) throw new Error('CSV file contains no data rows');
        proceedToMapping(headers, rows);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const { headers, rows } = parseExcelBuffer(buffer);
        if (rows.length === 0) throw new Error('Excel workbook contains no data rows');
        proceedToMapping(headers, rows);
      } else {
        throw new Error('Unsupported format. Please upload a .csv, .xlsx, or .xls file.');
      }
    } catch (err: any) {
      console.error('File parse error:', err);
      setErrorMessage(err.message || 'Failed to read file');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Process direct Paste text
  const handleProcessPastedText = () => {
    if (!rawPastedText.trim()) {
      setErrorMessage('Please paste spreadsheet CSV or TSV content');
      return;
    }

    try {
      const { headers, rows } = parseCsvText(rawPastedText);
      if (rows.length === 0 || headers.length === 0) {
        throw new Error('Could not parse valid columns from pasted text');
      }
      proceedToMapping(headers, rows);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse text');
    }
  };

  // Step 2 Transition
  const proceedToMapping = (headers: string[], rows: Record<string, any>[]) => {
    const detected = detectColumnMapping(headers);
    setParsedHeaders(headers);
    setParsedRows(rows);
    setColumnMap(detected);
    setStep('mapping');
  };

  // Final Step: Complete Import
  const handleFinalImport = () => {
    if (!columnMap.partNumber && !columnMap.name) {
      setErrorMessage('Please map at least Part Number or Component Name');
      return;
    }

    const { validParts, errors } = mapRowsToSpareParts(parsedRows, columnMap);
    if (validParts.length === 0) {
      setErrorMessage('No valid spare components could be extracted with current column mapping');
      return;
    }

    onImportSuccess(validParts, importMode);
    onClose();
    handleReset();
  };

  const handleDownloadTemplate = () => {
    const sample = getSampleTemplateCsv();
    downloadCsvFile(sample, 'spares_template.csv');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {step === 'input' ? 'Connect & Import Spreadsheet' : 'Review & Map Columns'}
              </h2>
              <p className="text-xs text-slate-400">
                {step === 'input' 
                  ? 'Import your spares catalog via Google Sheets link, Excel file, or CSV' 
                  : `Detected ${parsedRows.length} rows across ${parsedHeaders.length} columns`}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              handleReset();
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 flex items-start gap-2.5 p-3 text-xs bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {step === 'input' ? (
            <div className="space-y-5">
              
              {/* Tab Selector */}
              <div className="flex border-b border-slate-800">
                <button
                  onClick={() => {
                    setActiveTab('link');
                    setErrorMessage(null);
                  }}
                  className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                    activeTab === 'link'
                      ? 'border-emerald-400 text-emerald-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Link2 className="h-4 w-4" />
                  Via Spreadsheet Link (Google Sheets / Web URL)
                </button>

                <button
                  onClick={() => {
                    setActiveTab('file');
                    setErrorMessage(null);
                  }}
                  className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                    activeTab === 'file'
                      ? 'border-emerald-400 text-emerald-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  Upload Excel (.xlsx) / CSV File
                </button>

                <button
                  onClick={() => {
                    setActiveTab('paste');
                    setErrorMessage(null);
                  }}
                  className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                    activeTab === 'paste'
                      ? 'border-emerald-400 text-emerald-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  Paste CSV / TSV
                </button>
              </div>

              {/* Tab 1: Link */}
              {activeTab === 'link' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Spreadsheet URL / Google Sheets Link
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={spreadsheetUrl}
                        onChange={(e) => setSpreadsheetUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/.../edit or raw CSV link"
                        className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={handleFetchUrl}
                        disabled={isLoading}
                        className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold text-xs rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-500/20"
                      >
                        {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                        <span>Fetch & Preview</span>
                      </button>
                    </div>
                  </div>

                  {/* Google Sheets instruction helper */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-xs space-y-2 text-slate-400">
                    <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                      <HelpCircle className="h-4 w-4 text-emerald-400" />
                      <span>How to connect your Google Sheet:</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-400">
                      <li>Open your Google Sheet with your spares components.</li>
                      <li>
                        Click <span className="text-slate-200 font-semibold">Share</span> &rarr; select{' '}
                        <span className="text-emerald-400 font-semibold">"Anyone with the link can view"</span>.
                      </li>
                      <li>Copy the URL from your address bar and paste it above.</li>
                      <li>
                        <em>Alternative:</em> Go to <span className="text-slate-200">File &rarr; Share &rarr; Publish to web &rarr; Comma-separated values (.csv)</span>.
                      </li>
                    </ol>

                    {/* Pre-fill Sample link button */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">Want to test with sample data?</span>
                      <button
                        type="button"
                        onClick={() => {
                          // Standard public test sheet CSV URL or sample link
                          setSpreadsheetUrl('https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/export?format=csv');
                        }}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="h-3 w-3" />
                        Fill Sample Google Sheet Link
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* Tab 2: File Upload */}
              {activeTab === 'file' && (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFileUpload(e.dataTransfer.files[0]);
                      }
                    }}
                    className="border-2 border-dashed border-slate-700 hover:border-emerald-500/70 bg-slate-950/50 hover:bg-slate-950 rounded-xl p-8 text-center cursor-pointer transition-colors"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv, .xlsx, .xls"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                      <Upload className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-200">
                      Click to browse or drag and drop your spreadsheet here
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Supports Excel (.xlsx, .xls) and Comma-Separated Values (.csv)
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 3: Paste CSV */}
              {activeTab === 'paste' && (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-300">
                    Paste CSV or Tab-Delimited Data Directly
                  </label>
                  <textarea
                    rows={6}
                    value={rawPastedText}
                    onChange={(e) => setRawPastedText(e.target.value)}
                    placeholder="Part Number, Name, Quantity, Min Stock, Location, Unit Cost&#10;BRG-101, Roller Bearing, 12, 4, Shelf A, 15.00"
                    className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleProcessPastedText}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <span>Parse Pasted Content</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Template Download Bar */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800">
                <span>Need a standardized spreadsheet template?</span>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Sample CSV Template
                </button>
              </div>

            </div>
          ) : (
            /* STEP 2: COLUMN MAPPING & PREVIEW */
            <div className="space-y-5">
              <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-3.5 text-xs text-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>
                    Successfully parsed <strong>{parsedRows.length} rows</strong>. Map the columns below to match your spares format.
                  </span>
                </div>
                <button
                  onClick={handleReset}
                  className="text-[11px] underline hover:text-white cursor-pointer"
                >
                  Change file / link
                </button>
              </div>

              {/* Mapping Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                
                {/* Part Number */}
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <label className="block text-[11px] font-semibold text-cyan-300 mb-1">
                    Part # / SKU Column <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={columnMap.partNumber}
                    onChange={(e) => setColumnMap({ ...columnMap, partNumber: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- Select Column --</option>
                    {parsedHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Name */}
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <label className="block text-[11px] font-semibold text-slate-200 mb-1">
                    Component Name / Title <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={columnMap.name}
                    onChange={(e) => setColumnMap({ ...columnMap, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- Select Column --</option>
                    {parsedHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <label className="block text-[11px] font-semibold text-emerald-300 mb-1">
                    Quantity on Hand Column
                  </label>
                  <select
                    value={columnMap.quantity}
                    onChange={(e) => setColumnMap({ ...columnMap, quantity: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- None (Defaults to 0) --</option>
                    {parsedHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Min Stock */}
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <label className="block text-[11px] font-semibold text-amber-300 mb-1">
                    Min Stock Threshold
                  </label>
                  <select
                    value={columnMap.minStock || ''}
                    onChange={(e) => setColumnMap({ ...columnMap, minStock: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 focus:outline-none"
                  >
                    <option value="">-- None (Defaults to 5) --</option>
                    {parsedHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Category Column
                  </label>
                  <select
                    value={columnMap.category || ''}
                    onChange={(e) => setColumnMap({ ...columnMap, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 focus:outline-none"
                  >
                    <option value="">-- None (Auto-categorize) --</option>
                    {parsedHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Bin / Location Column
                  </label>
                  <select
                    value={columnMap.location || ''}
                    onChange={(e) => setColumnMap({ ...columnMap, location: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 focus:outline-none"
                  >
                    <option value="">-- None (Unassigned) --</option>
                    {parsedHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cost */}
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Unit Cost Column
                  </label>
                  <select
                    value={columnMap.unitCost || ''}
                    onChange={(e) => setColumnMap({ ...columnMap, unitCost: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 focus:outline-none"
                  >
                    <option value="">-- None ($0.00) --</option>
                    {parsedHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Supplier */}
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Supplier / Vendor
                  </label>
                  <select
                    value={columnMap.supplier || ''}
                    onChange={(e) => setColumnMap({ ...columnMap, supplier: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 focus:outline-none"
                  >
                    <option value="">-- None --</option>
                    {parsedHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Equipment */}
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Machine / Equipment
                  </label>
                  <select
                    value={columnMap.equipment || ''}
                    onChange={(e) => setColumnMap({ ...columnMap, equipment: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 focus:outline-none"
                  >
                    <option value="">-- None --</option>
                    {parsedHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Data Preview Table */}
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-1.5">
                  First 3 Rows Preview:
                </span>
                <div className="overflow-x-auto border border-slate-800 rounded-lg bg-slate-950">
                  <table className="w-full text-left text-[11px] text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                      <tr>
                        {parsedHeaders.slice(0, 6).map((h) => (
                          <th key={h} className="p-2 truncate max-w-[120px]">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {parsedRows.slice(0, 3).map((r, i) => (
                        <tr key={i}>
                          {parsedHeaders.slice(0, 6).map((h) => (
                            <td key={h} className="p-2 truncate max-w-[120px] text-slate-400">
                              {String(r[h] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Import Mode Options */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-200 block">Import Mode:</span>
                  <span className="text-slate-400 text-[11px]">
                    Choose whether to combine with current spares or start clean
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="importMode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="text-emerald-500 focus:ring-0"
                    />
                    <span>Merge (Append)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-rose-500 focus:ring-0"
                    />
                    <span className="text-rose-300 font-medium">Replace Entire Catalog</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
                >
                  &larr; Back
                </button>
                <button
                  type="button"
                  onClick={handleFinalImport}
                  className="px-6 py-2.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Confirm & Import {parsedRows.length} Spares</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
