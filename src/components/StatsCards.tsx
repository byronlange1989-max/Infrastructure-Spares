import React from 'react';
import { Package, Layers, AlertTriangle, XCircle } from 'lucide-react';
import { SparePart, StockStatus } from '../types/inventory';

interface StatsCardsProps {
  parts: SparePart[];
  selectedStatusFilter: string | null;
  onSelectStatusFilter: (status: StockStatus | null) => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  parts,
  selectedStatusFilter,
  onSelectStatusFilter,
}) => {
  const totalComponents = parts.length;
  const totalUnits = parts.reduce((acc, p) => acc + p.quantity, 0);

  const lowStockParts = parts.filter((p) => p.quantity > 0 && p.quantity <= p.minStock);
  const outOfStockParts = parts.filter((p) => p.quantity === 0);

  const isLowStockActive = selectedStatusFilter === 'Low Stock';
  const isOutOfStockActive = selectedStatusFilter === 'Out of Stock';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      
      {/* Total Components */}
      <div 
        onClick={() => onSelectStatusFilter(null)}
        className={`bg-slate-900 border rounded-xl p-3.5 shadow-sm transition-all cursor-pointer ${
          selectedStatusFilter === null 
            ? 'border-cyan-500/50 ring-1 ring-cyan-500/30' 
            : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Components</span>
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
            <Package className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white tracking-tight">{totalComponents}</div>
        <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
          <span>Active SKUs</span>
          <span className="text-cyan-400 font-medium">All items</span>
        </div>
      </div>

      {/* Total Units */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Total Units</span>
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Layers className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white tracking-tight">
          {totalUnits.toLocaleString()}
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          Stock across all bins
        </div>
      </div>

      {/* Low Stock (Reorder Needed) */}
      <div
        onClick={() => onSelectStatusFilter(isLowStockActive ? null : 'Low Stock')}
        className={`bg-slate-900 border rounded-xl p-3.5 shadow-sm transition-all cursor-pointer ${
          isLowStockActive
            ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-950/20'
            : lowStockParts.length > 0
            ? 'border-amber-500/30 hover:border-amber-500/60 bg-amber-950/10'
            : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-amber-300">Low Stock</span>
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-amber-300 tracking-tight">
          {lowStockParts.length}
        </div>
        <div className="text-[11px] text-amber-400/80 mt-1 flex items-center justify-between">
          <span>Below min threshold</span>
          <span className="underline decoration-dotted text-xs">
            {isLowStockActive ? 'Clear filter' : 'Filter'}
          </span>
        </div>
      </div>

      {/* Out of Stock */}
      <div
        onClick={() => onSelectStatusFilter(isOutOfStockActive ? null : 'Out of Stock')}
        className={`bg-slate-900 border rounded-xl p-3.5 shadow-sm transition-all cursor-pointer ${
          isOutOfStockActive
            ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-950/20'
            : outOfStockParts.length > 0
            ? 'border-rose-500/30 hover:border-rose-500/60 bg-rose-950/10'
            : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-rose-300">Out of Stock</span>
          <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
            <XCircle className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-rose-300 tracking-tight">
          {outOfStockParts.length}
        </div>
        <div className="text-[11px] text-rose-400/80 mt-1 flex items-center justify-between">
          <span>Zero quantity</span>
          <span className="underline decoration-dotted text-xs">
            {isOutOfStockActive ? 'Clear filter' : 'Filter'}
          </span>
        </div>
      </div>

    </div>
  );
};
