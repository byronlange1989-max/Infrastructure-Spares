import React from 'react';
import { 
  X, 
  MapPin, 
  Package, 
  DollarSign, 
  Truck, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Minus, 
  Edit3, 
  Trash2, 
  History,
  QrCode,
  Layers,
  Copy,
  Check
} from 'lucide-react';
import { SparePart, StockTransaction } from '../types/inventory';

interface PartDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  part: SparePart | null;
  transactions: StockTransaction[];
  onOpenStockModal: (part: SparePart, type: 'STOCK_IN' | 'STOCK_OUT') => void;
  onEditPart: (part: SparePart) => void;
  onDeletePart: (part: SparePart) => void;
}

export const PartDetailModal: React.FC<PartDetailModalProps> = ({
  isOpen,
  onClose,
  part,
  transactions,
  onOpenStockModal,
  onEditPart,
  onDeletePart,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !part) return null;

  const partTransactions = transactions.filter((t) => t.partId === part.id || t.partNumber === part.partNumber);

  const isOutOfStock = part.quantity === 0;
  const isLowStock = !isOutOfStock && part.quantity <= part.minStock;

  const handleCopy = () => {
    navigator.clipboard.writeText(part.partNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-base font-bold text-cyan-300 bg-cyan-950/50 px-2.5 py-1 rounded-lg border border-cyan-800/40">
                  {part.partNumber}
                </span>
                <button
                  onClick={handleCopy}
                  title="Copy Part Number"
                  className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {part.category}
                </span>
                {part.criticality === 'High' && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                    High Criticality
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-white mt-1">{part.name}</h2>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Stock Level Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-xs text-slate-400 uppercase font-medium block">Stock on Hand</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-3xl font-extrabold font-mono ${
                  isOutOfStock ? 'text-rose-400' : isLowStock ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {part.quantity}
                </span>
                <span className="text-slate-400 text-sm">{part.unit}</span>
              </div>
              <span className="text-[11px] text-slate-500">Min Safety Buffer: {part.minStock} {part.unit}</span>
            </div>

            <div>
              <span className="text-xs text-slate-400 uppercase font-medium block">Current Status</span>
              <div className="mt-1.5">
                {isOutOfStock ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    OUT OF STOCK
                  </span>
                ) : isLowStock ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    REORDER REQUIRED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    HEALTHY BUFFER
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 block mt-1">
                {part.quantity <= part.minStock ? `Deficit: ${part.minStock - part.quantity + 1} units needed` : 'Adequate supply'}
              </span>
            </div>
          </div>

          {/* Quick Stock Movement Buttons */}
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => {
                onClose();
                onOpenStockModal(part, 'STOCK_IN');
              }}
              className="flex-1 py-2.5 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Receive More Spares (Stock In)</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenStockModal(part, 'STOCK_OUT');
              }}
              disabled={part.quantity <= 0}
              className="flex-1 py-2.5 px-4 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-30 text-amber-300 border border-amber-500/30 rounded-xl font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Minus className="h-4 w-4" />
              <span>Issue / Use Spares (Stock Out)</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onEditPart(part);
              }}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Edit3 className="h-4 w-4" />
              <span>Edit</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onDeletePart(part);
              }}
              className="py-2.5 px-4 bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 border border-rose-500/30 rounded-xl font-medium text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
          </div>

          {/* Specification Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            
            {/* Storage & Machinery */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Storage & Location
              </h3>
              
              <div className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-cyan-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Warehouse Bin / Rack</span>
                  <span className="font-semibold text-slate-200">{part.location || 'Not Assigned'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Cpu className="h-4 w-4 text-indigo-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Installed on Equipment</span>
                  <span className="font-semibold text-slate-200">{part.equipment || 'General Plant'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Truck className="h-4 w-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Supplier / Vendor</span>
                  <span className="font-semibold text-slate-200">{part.supplier || 'Generic'}</span>
                </div>
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Technical Data & Notes
              </h3>

              <div>
                <span className="text-slate-400 block text-[11px]">Engineering Specifications</span>
                <p className="text-slate-200 font-mono text-xs mt-0.5 bg-slate-900 p-2 rounded border border-slate-800">
                  {part.specs || 'No specific dimension or electrical parameters registered.'}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Operating / Storage Notes</span>
                <p className="text-slate-300 text-xs mt-0.5">
                  {part.notes || 'None recorded.'}
                </p>
              </div>
            </div>

          </div>

          {/* Component Movement History */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-slate-400" />
              <span>Stock Ledger for this Component ({partTransactions.length} events)</span>
            </h3>

            {partTransactions.length === 0 ? (
              <p className="text-xs text-slate-500 italic bg-slate-950 p-3 rounded-lg border border-slate-800">
                No individual stock transactions recorded yet for this component.
              </p>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-800/60 overflow-hidden text-xs">
                {partTransactions.map((tx) => (
                  <div key={tx.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${tx.quantityChange > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange} {part.unit}
                        </span>
                        <span className="text-slate-400">({tx.reason})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {tx.technician && <span>By {tx.technician} • </span>}
                        {tx.workOrder && <span>{tx.workOrder} • </span>}
                        <span>{new Date(tx.timestamp).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="font-mono text-right text-slate-400">
                      Balance: <span className="font-bold text-slate-200">{tx.newQuantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
