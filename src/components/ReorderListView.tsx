import React from 'react';
import { X, ShoppingCart, CheckCircle } from 'lucide-react';
import { SparePart } from '../types/inventory';

interface ReorderListViewProps {
  isOpen: boolean;
  onClose: () => void;
  parts: SparePart[];
  onQuickReceive: (part: SparePart) => void;
}

export const ReorderListView: React.FC<ReorderListViewProps> = ({
  isOpen,
  onClose,
  parts,
  onQuickReceive,
}) => {
  if (!isOpen) return null;

  // Filter items where quantity <= minStock
  const lowStockParts = parts.filter((p) => p.quantity <= p.minStock);

  // Suggested reorder formula: (minStock * 2) - currentQuantity
  const orderItems = lowStockParts.map((p) => {
    const suggestedOrder = Math.max(1, p.minStock * 2 - p.quantity);
    return {
      part: p,
      suggestedOrder,
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Reorder & Restock Planner
                <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  {lowStockParts.length} items needing attention
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Components currently at or below minimum safety stock levels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {/* Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-medium">Reorder Items</span>
              <div className="text-xl font-bold text-amber-400 mt-0.5">{orderItems.length} SKUs</div>
              <span className="text-[11px] text-slate-500">Require replenishment</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-medium">Out of Stock Critically</span>
              <div className="text-xl font-bold text-rose-400 mt-0.5">
                {orderItems.filter((i) => i.part.quantity === 0).length} SKUs
              </div>
              <span className="text-[11px] text-slate-500">Zero inventory remaining</span>
            </div>
          </div>

          {/* Table */}
          {orderItems.length === 0 ? (
            <div className="py-12 text-center bg-slate-950 rounded-xl border border-slate-800">
              <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-200">All Spares Healthy!</h3>
              <p className="text-xs text-slate-500 mt-1">
                No items are currently below their minimum stock thresholds.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Part #</th>
                    <th className="py-2.5 px-3">Component</th>
                    <th className="py-2.5 px-3 text-center">On Hand</th>
                    <th className="py-2.5 px-3 text-center">Min Level</th>
                    <th className="py-2.5 px-3 text-center">Suggested Order</th>
                    <th className="py-2.5 px-3">Supplier</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {orderItems.map(({ part, suggestedOrder }) => (
                    <tr key={part.id} className="hover:bg-slate-900/60">
                      <td className="py-2.5 px-3 font-semibold text-cyan-300">
                        {part.partNumber}
                      </td>
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-200 max-w-[220px] truncate">
                        {part.name}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`font-bold ${part.quantity === 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                          {part.quantity}
                        </span>{' '}
                        <span className="text-[10px] text-slate-500 font-sans">{part.unit}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-400">
                        {part.minStock}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/50">
                          +{suggestedOrder} {part.unit}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-400 max-w-[160px] truncate">
                        {part.supplier}
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        <button
                          onClick={() => {
                            onQuickReceive(part);
                            onClose();
                          }}
                          className="px-2 py-1 text-[11px] rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 transition-colors cursor-pointer"
                        >
                          Receive
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
            >
              Close
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
