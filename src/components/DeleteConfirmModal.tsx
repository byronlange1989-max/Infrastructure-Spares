import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { SparePart } from '../types/inventory';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  part: SparePart | null;
  onConfirm: (part: SparePart) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  part,
  onConfirm,
}) => {
  if (!isOpen || !part) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5 text-rose-400">
            <Trash2 className="h-5 w-5" />
            <h2 className="text-base font-bold text-white">Remove Component</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to completely remove this component from your inventory catalog?
          </p>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Part Number:</span>
              <span className="font-mono font-semibold text-cyan-300">{part.partNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Name:</span>
              <span className="text-slate-200 font-medium text-right max-w-[220px] truncate">{part.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Category:</span>
              <span className="text-slate-300">{part.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Current Stock:</span>
              <span className={`font-mono font-bold ${part.quantity > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                {part.quantity} {part.unit}
              </span>
            </div>
          </div>

          {part.quantity > 0 && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                <strong>Warning:</strong> This item still has <strong>{part.quantity} units</strong> on hand. Removing it will delete its stock records. If you just used parts, consider using <em>Stock Out</em> instead.
              </span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm(part);
                onClose();
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-lg shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Component
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
