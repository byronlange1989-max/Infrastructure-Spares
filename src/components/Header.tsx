import React from 'react';
import { 
  Boxes, 
  Plus, 
  AlertTriangle, 
  History, 
  RefreshCw 
} from 'lucide-react';
import { SparePart } from '../types/inventory';

interface HeaderProps {
  parts: SparePart[];
  lowStockCount: number;
  onOpenAddModal: () => void;
  onOpenHistoryModal: () => void;
  onOpenReorderModal: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  parts,
  lowStockCount,
  onOpenAddModal,
  onOpenHistoryModal,
  onOpenReorderModal,
  onResetData,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-400/30">
              <Boxes className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Infrastructure Spares
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Component Inventory
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                Track, add, issue and manage infrastructure components
              </p>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center flex-wrap gap-2">
            
            {/* Reorder Alerts */}
            <button
              onClick={onOpenReorderModal}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                lowStockCount > 0
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className={`h-4 w-4 ${lowStockCount > 0 ? 'text-amber-400 animate-pulse' : ''}`} />
              <span>Reorders</span>
              {lowStockCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold">
                  {lowStockCount}
                </span>
              )}
            </button>

            {/* Audit History */}
            <button
              onClick={onOpenHistoryModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              title="View stock movement & transactions log"
            >
              <History className="h-4 w-4 text-slate-400" />
              <span>Audit Log</span>
            </button>

            {/* Add Part Button (Primary) */}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition-all transform active:scale-95 cursor-pointer ml-1"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Add Component</span>
            </button>

            {/* Clear / Reset Data */}
            <button
              onClick={onResetData}
              title="Clear all components"
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
