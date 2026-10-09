import React, { useState } from 'react';
import { X, PackagePlus, PackageMinus, AlertCircle, ArrowRight } from 'lucide-react';
import { SparePart, StockTransaction, TransactionType } from '../types/inventory';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  part: SparePart | null;
  mode: 'STOCK_IN' | 'STOCK_OUT';
  onSubmit: (
    part: SparePart,
    type: TransactionType,
    quantityChange: number,
    reason: string,
    technician: string,
    workOrder: string
  ) => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  part,
  mode,
  onSubmit,
}) => {
  const [amount, setAmount] = useState<number>(1);
  const [reason, setReason] = useState('');
  const [technician, setTechnician] = useState('');
  const [workOrder, setWorkOrder] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !part) return null;

  const isStockIn = mode === 'STOCK_IN';
  const newQuantity = isStockIn
    ? part.quantity + (amount || 0)
    : Math.max(0, part.quantity - (amount || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setError('Please enter a valid quantity greater than 0');
      return;
    }
    if (!isStockIn && amount > part.quantity) {
      setError(`Cannot issue ${amount} units. Only ${part.quantity} in stock.`);
      return;
    }
    if (!reason.trim()) {
      setError('Please state a reason for this stock adjustment');
      return;
    }

    const delta = isStockIn ? amount : -amount;
    onSubmit(
      part,
      isStockIn ? 'STOCK_IN' : 'STOCK_OUT',
      delta,
      reason.trim(),
      technician.trim() || 'Storekeeper',
      workOrder.trim() || (isStockIn ? 'RESTOCK' : 'MAINT-LOG')
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isStockIn ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
              {isStockIn ? <PackagePlus className="h-5 w-5" /> : <PackageMinus className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isStockIn ? 'Receive Spares (Stock In)' : 'Issue Spares (Stock Out)'}
              </h2>
              <p className="text-xs text-slate-400">
                {part.partNumber} • {part.name}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quantity Projection Bar */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 block uppercase font-medium">Current Stock</span>
              <span className="text-xl font-bold font-mono text-slate-300">
                {part.quantity} <span className="text-xs font-normal text-slate-500">{part.unit}</span>
              </span>
            </div>

            <ArrowRight className="h-5 w-5 text-slate-600" />

            <div>
              <span className="text-[11px] text-slate-500 block uppercase font-medium">Adjustment</span>
              <span className={`text-xl font-bold font-mono ${isStockIn ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isStockIn ? `+${amount || 0}` : `-${amount || 0}`}
              </span>
            </div>

            <ArrowRight className="h-5 w-5 text-slate-600" />

            <div>
              <span className="text-[11px] text-slate-500 block uppercase font-medium">Projected Stock</span>
              <span className={`text-xl font-bold font-mono ${
                newQuantity === 0 ? 'text-rose-400' : newQuantity <= part.minStock ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {newQuantity} <span className="text-xs font-normal text-slate-500">{part.unit}</span>
              </span>
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Quantity to {isStockIn ? 'Add' : 'Remove / Issue'} ({part.unit}) <span className="text-rose-400">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max={isStockIn ? undefined : part.quantity}
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-lg font-mono font-bold text-white focus:outline-none focus:border-cyan-500"
                required
                autoFocus
              />
              {/* Quick preset buttons */}
              {[1, 5, 10].map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className="px-2.5 py-2 text-xs font-mono font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                >
                  +{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Reason / Purpose <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isStockIn
                  ? 'e.g. Received shipment from supplier, inventory audit bonus'
                  : 'e.g. Conveyor line 1 bearing overhaul, motor vibration repair'
              }
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          {/* Technician & Work Order */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Technician / User
              </label>
              <input
                type="text"
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                placeholder="e.g. J. Smith (Tech)"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Work Order / PO #
              </label>
              <input
                type="text"
                value={workOrder}
                onChange={(e) => setWorkOrder(e.target.value)}
                placeholder={isStockIn ? 'e.g. PO-99120' : 'e.g. WO-4402'}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-xs font-semibold rounded-lg shadow-lg transition-all cursor-pointer ${
                isStockIn
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
              }`}
            >
              {isStockIn ? 'Confirm Stock In' : 'Confirm Stock Out'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
