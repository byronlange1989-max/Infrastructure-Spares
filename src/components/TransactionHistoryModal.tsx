import React, { useState } from 'react';
import { 
  X, 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  PlusCircle, 
  Trash2, 
  Sliders, 
  Search,
  Calendar,
  User,
  FileText
} from 'lucide-react';
import { StockTransaction, TransactionType } from '../types/inventory';

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: StockTransaction[];
  onClearHistory?: () => void;
}

export const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  isOpen,
  onClose,
  transactions,
  onClearHistory,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filtered = transactions.filter((tx) => {
    if (filterType !== 'ALL' && tx.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPart = tx.partNumber.toLowerCase().includes(q) || tx.partName.toLowerCase().includes(q);
      const matchTech = tx.technician?.toLowerCase().includes(q);
      const matchReason = tx.reason.toLowerCase().includes(q);
      const matchWO = tx.workOrder?.toLowerCase().includes(q);
      return matchPart || matchTech || matchReason || matchWO;
    }
    return true;
  });

  const getBadge = (type: TransactionType) => {
    switch (type) {
      case 'STOCK_IN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <ArrowDownLeft className="h-3 w-3" />
            Stock In
          </span>
        );
      case 'STOCK_OUT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <ArrowUpRight className="h-3 w-3" />
            Stock Out
          </span>
        );
      case 'PART_ADDED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <PlusCircle className="h-3 w-3" />
            Created
          </span>
        );
      case 'PART_REMOVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <Trash2 className="h-3 w-3" />
            Deleted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-700 text-slate-300">
            <Sliders className="h-3 w-3" />
            Adjustment
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Stock Movement & Audit Log</h2>
              <p className="text-xs text-slate-400">
                Complete historical record of parts added, removed, issued, and received
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

        {/* Filters */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by part #, tech, reason..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
            <span className="text-slate-400">Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Events ({transactions.length})</option>
              <option value="STOCK_IN">Stock In (Received)</option>
              <option value="STOCK_OUT">Stock Out (Issued)</option>
              <option value="ADJUSTMENT">Adjustments (+/-)</option>
              <option value="PART_ADDED">New Parts Added</option>
              <option value="PART_REMOVED">Parts Deleted</option>
            </select>
          </div>
        </div>

        {/* Log List */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              No transactions found matching your filter criteria.
            </div>
          ) : (
            filtered.map((tx) => (
              <div
                key={tx.id}
                className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    {getBadge(tx.type)}
                    <span className="font-mono text-xs font-bold text-cyan-300">
                      {tx.partNumber}
                    </span>
                    <span className="text-xs text-slate-300 font-medium truncate max-w-[240px]">
                      {tx.partName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                    <Calendar className="h-3 w-3 text-slate-500" />
                    <span>{new Date(tx.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-300 pl-1">
                  <p className="text-slate-300">{tx.reason}</p>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-3">
                    {tx.technician && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <User className="h-3 w-3 text-slate-500" />
                        {tx.technician}
                      </span>
                    )}
                    {tx.workOrder && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <FileText className="h-3 w-3 text-slate-500" />
                        {tx.workOrder}
                      </span>
                    )}
                  </div>

                  <div className="font-mono text-xs">
                    {tx.quantityChange !== 0 && (
                      <span className="mr-3">
                        Delta:{' '}
                        <strong
                          className={tx.quantityChange > 0 ? 'text-emerald-400' : 'text-amber-400'}
                        >
                          {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                        </strong>
                      </span>
                    )}
                    <span>
                      Stock Level: {tx.previousQuantity} &rarr;{' '}
                      <strong className="text-slate-200">{tx.newQuantity}</strong>
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Showing {filtered.length} of {transactions.length} total entries
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
