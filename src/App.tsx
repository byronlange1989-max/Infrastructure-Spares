import React, { useState, useEffect } from 'react';
import { 
  loadSavedParts, 
  saveParts, 
  loadSavedTransactions, 
  saveTransactions, 
  resetToDefaultData 
} from './utils/storage';
import { 
  apiGetParts, 
  apiAddPart, 
  apiUpdatePart, 
  apiDeletePart, 
  apiBatchDelete, 
  apiAdjustStock, 
  apiGetTransactions, 
  apiImportParts 
} from './utils/api';
import { SparePart, StockTransaction, TransactionType, StockStatus } from './types/inventory';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { InventoryTable } from './components/InventoryTable';
import { PartModal } from './components/PartModal';
import { StockAdjustmentModal } from './components/StockAdjustmentModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ReorderListView } from './components/ReorderListView';
import { TransactionHistoryModal } from './components/TransactionHistoryModal';
import { PartDetailModal } from './components/PartDetailModal';
import { 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Package
} from 'lucide-react';

export function App() {
  // State
  const [parts, setParts] = useState<SparePart[]>(() => loadSavedParts());
  const [transactions, setTransactions] = useState<StockTransaction[]>(() => loadSavedTransactions());
  const [isServerConnected, setIsServerConnected] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & search
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<StockStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [partToEdit, setPartToEdit] = useState<SparePart | null>(null);

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockModalPart, setStockModalPart] = useState<SparePart | null>(null);
  const [stockModalMode, setStockModalMode] = useState<'STOCK_IN' | 'STOCK_OUT'>('STOCK_IN');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [partToDelete, setPartToDelete] = useState<SparePart | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [inspectPart, setInspectPart] = useState<SparePart | null>(null);

  // Flash notification toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Initial fetch from Express server backend
  useEffect(() => {
    async function initData() {
      try {
        const [serverParts, serverTxs] = await Promise.all([
          apiGetParts(),
          apiGetTransactions(),
        ]);
        setParts(serverParts);
        setTransactions(serverTxs);
        saveParts(serverParts);
        saveTransactions(serverTxs);
        setIsServerConnected(true);
      } catch (err) {
        console.warn('Could not connect to server API, using local storage cache:', err);
        setIsServerConnected(false);
      } finally {
        setIsLoading(false);
      }
    }
    initData();
  }, []);

  // Sync to localStorage as client cache
  useEffect(() => {
    saveParts(parts);
  }, [parts]);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  // Low stock counter
  const lowStockCount = parts.filter((p) => p.quantity <= p.minStock).length;

  // 1. Add or Update Part
  const handleSavePart = async (partData: Omit<SparePart, 'id' | 'lastUpdated'>, existingId?: string) => {
    const timestamp = new Date().toISOString();

    if (existingId) {
      // Edit
      const updatedPart = {
        ...partData,
        id: existingId,
        lastUpdated: timestamp,
      };

      setParts((prev) =>
        prev.map((p) => (p.id === existingId ? { ...p, ...partData, lastUpdated: timestamp } : p))
      );

      // Async server call
      try {
        await apiUpdatePart(existingId, partData);
      } catch (err) {
        console.warn('Server sync failed, saved locally:', err);
      }

      showToast(`Component ${partData.partNumber} updated`);
    } else {
      // New Part
      const tempId = `sp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newPart: SparePart = {
        ...partData,
        id: tempId,
        lastUpdated: timestamp,
      };

      setParts((prev) => [newPart, ...prev]);

      const newTx: StockTransaction = {
        id: `tx-${Date.now()}`,
        partId: tempId,
        partNumber: newPart.partNumber,
        partName: newPart.name,
        type: 'PART_ADDED',
        quantityChange: newPart.quantity,
        previousQuantity: 0,
        newQuantity: newPart.quantity,
        reason: 'New component added to inventory',
        technician: 'Inventory Admin',
        timestamp,
      };
      setTransactions((txs) => [newTx, ...txs]);

      // Server call
      try {
        const saved = await apiAddPart(partData);
        if (saved && saved.id) {
          setParts((prev) => prev.map((p) => (p.id === tempId ? saved : p)));
        }
      } catch (err) {
        console.warn('Server sync failed, saved locally:', err);
      }

      showToast(`Component ${newPart.partNumber} added to catalog`);
    }
  };

  // 2. Quick Increment / Decrement
  const handleQuickAdjustQuantity = async (part: SparePart, delta: number) => {
    const newQuantity = Math.max(0, part.quantity + delta);
    if (newQuantity === part.quantity) return;

    const timestamp = new Date().toISOString();

    setParts((prev) =>
      prev.map((p) =>
        p.id === part.id
          ? {
              ...p,
              quantity: newQuantity,
              lastUpdated: timestamp,
            }
          : p
      )
    );

    const newTx: StockTransaction = {
      id: `tx-${Date.now()}`,
      partId: part.id,
      partNumber: part.partNumber,
      partName: part.name,
      type: delta > 0 ? 'STOCK_IN' : 'STOCK_OUT',
      quantityChange: delta,
      previousQuantity: part.quantity,
      newQuantity,
      reason: delta > 0 ? 'Quick Restock (+1)' : 'Quick Use (-1)',
      technician: 'Quick Adjustment',
      timestamp,
    };
    setTransactions((txs) => [newTx, ...txs]);

    // Server adjust
    try {
      await apiAdjustStock({
        partId: part.id,
        type: delta > 0 ? 'STOCK_IN' : 'STOCK_OUT',
        quantityChange: delta,
        reason: delta > 0 ? 'Quick Restock (+1)' : 'Quick Use (-1)',
        technician: 'Quick Stepper',
      });
    } catch (err) {
      console.warn('Server adjust failed, updated locally:', err);
    }

    showToast(
      `${part.partNumber} updated to ${newQuantity} ${part.unit}`,
      newQuantity <= part.minStock ? 'warning' : 'info'
    );
  };

  // 3. Detailed Stock Adjustment (Stock In / Stock Out)
  const handleStockAdjustment = async (
    part: SparePart,
    type: TransactionType,
    quantityChange: number,
    reason: string,
    technician: string,
    workOrder: string
  ) => {
    const newQuantity = Math.max(0, part.quantity + quantityChange);
    const timestamp = new Date().toISOString();

    setParts((prev) =>
      prev.map((p) =>
        p.id === part.id
          ? {
              ...p,
              quantity: newQuantity,
              lastUpdated: timestamp,
            }
          : p
      )
    );

    const newTx: StockTransaction = {
      id: `tx-${Date.now()}`,
      partId: part.id,
      partNumber: part.partNumber,
      partName: part.name,
      type,
      quantityChange,
      previousQuantity: part.quantity,
      newQuantity,
      reason,
      technician,
      workOrder,
      timestamp,
    };
    setTransactions((txs) => [newTx, ...txs]);

    // Server call
    try {
      await apiAdjustStock({
        partId: part.id,
        type,
        quantityChange,
        reason,
        technician,
        workOrder,
      });
    } catch (err) {
      console.warn('Server adjust failed, updated locally:', err);
    }

    showToast(
      `${type === 'STOCK_IN' ? 'Received' : 'Issued'} ${Math.abs(quantityChange)} ${part.unit} for ${part.partNumber}`,
      type === 'STOCK_IN' ? 'success' : 'info'
    );
  };

  // 4. Delete Component
  const handleDeletePart = async (part: SparePart) => {
    const timestamp = new Date().toISOString();
    setParts((prev) => prev.filter((p) => p.id !== part.id));

    const newTx: StockTransaction = {
      id: `tx-${Date.now()}`,
      partId: part.id,
      partNumber: part.partNumber,
      partName: part.name,
      type: 'PART_REMOVED',
      quantityChange: -part.quantity,
      previousQuantity: part.quantity,
      newQuantity: 0,
      reason: `Component ${part.partNumber} removed from catalog`,
      technician: 'Inventory Admin',
      timestamp,
    };
    setTransactions((txs) => [newTx, ...txs]);

    // Server call
    try {
      await apiDeletePart(part.id);
    } catch (err) {
      console.warn('Server delete failed, deleted locally:', err);
    }

    showToast(`Component ${part.partNumber} removed from inventory`, 'warning');
  };

  // 5. Batch Delete
  const handleBatchDelete = async (ids: string[]) => {
    const timestamp = new Date().toISOString();
    const removedCount = ids.length;

    setParts((prev) => prev.filter((p) => !ids.includes(p.id)));

    const batchTx: StockTransaction = {
      id: `tx-${Date.now()}`,
      partId: 'batch',
      partNumber: 'BATCH-DELETE',
      partName: `${removedCount} components removed in batch`,
      type: 'PART_REMOVED',
      quantityChange: 0,
      previousQuantity: 0,
      newQuantity: 0,
      reason: `Batch removal of ${removedCount} components`,
      technician: 'Inventory Admin',
      timestamp,
    };
    setTransactions((txs) => [batchTx, ...txs]);

    try {
      await apiBatchDelete(ids);
    } catch (err) {
      console.warn('Server batch delete failed:', err);
    }

    showToast(`${removedCount} components deleted in batch`, 'warning');
  };

  // 6. Clear or Reset
  const handleResetData = () => {
    if (window.confirm('Clear all current components to start with a fresh blank list?')) {
      resetToDefaultData();
      setParts([]);
      setTransactions([]);
      apiImportParts([], 'replace').catch(() => {});
      showToast('Inventory cleared', 'info');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold ${
              toastMessage.type === 'warning'
                ? 'bg-amber-950/90 text-amber-200 border-amber-500/50'
                : toastMessage.type === 'info'
                ? 'bg-blue-950/90 text-blue-200 border-blue-500/50'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
            }`}
          >
            {toastMessage.type === 'warning' ? (
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            ) : (
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        parts={parts}
        lowStockCount={lowStockCount}
        onOpenAddModal={() => {
          setPartToEdit(null);
          setIsPartModalOpen(true);
        }}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        onOpenReorderModal={() => setIsReorderModalOpen(true)}
        onResetData={handleResetData}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {parts.length === 0 ? (
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center shadow-xl mb-8">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 ring-1 ring-cyan-500/30">
              <Package className="h-7 w-7" />
            </div>
            
            <h2 className="text-xl font-bold text-white tracking-tight">
              No Components in Catalog
            </h2>
            
            <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
              Your infrastructure spares catalog is currently empty. Click below to add your components.
            </p>

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => {
                  setPartToEdit(null);
                  setIsPartModalOpen(true);
                }}
                className="px-5 py-2.5 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>Add Component</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* KPI Stats Overview */}
            <StatsCards
              parts={parts}
              selectedStatusFilter={selectedStatusFilter}
              onSelectStatusFilter={setSelectedStatusFilter}
            />

            {/* Main Inventory Table with Controls */}
            <InventoryTable
              parts={parts}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              selectedStatusFilter={selectedStatusFilter}
              onSelectStatusFilter={setSelectedStatusFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onQuickAdjustQuantity={handleQuickAdjustQuantity}
              onOpenStockModal={(part, type) => {
                setStockModalPart(part);
                setStockModalMode(type);
                setIsStockModalOpen(true);
              }}
              onEditPart={(part) => {
                setPartToEdit(part);
                setIsPartModalOpen(true);
              }}
              onDeletePart={(part) => {
                setPartToDelete(part);
                setIsDeleteModalOpen(true);
              }}
              onViewDetails={(part) => setInspectPart(part)}
              onBatchDelete={handleBatchDelete}
            />
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/50 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>Infrastructure Spares &bull; Component Inventory Control</p>
          <p className="text-slate-500">Fast, accurate infrastructure parts management</p>
        </div>
      </footer>

      {/* Modals */}
      
      {/* 1. Add / Edit Part Modal */}
      <PartModal
        isOpen={isPartModalOpen}
        onClose={() => {
          setIsPartModalOpen(false);
          setPartToEdit(null);
        }}
        onSave={handleSavePart}
        partToEdit={partToEdit}
      />

      {/* 2. Stock Adjustment Modal (Stock In / Stock Out) */}
      <StockAdjustmentModal
        isOpen={isStockModalOpen}
        onClose={() => {
          setIsStockModalOpen(false);
          setStockModalPart(null);
        }}
        part={stockModalPart}
        mode={stockModalMode}
        onSubmit={handleStockAdjustment}
      />

      {/* 3. Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setPartToDelete(null);
        }}
        part={partToDelete}
        onConfirm={handleDeletePart}
      />

      {/* 4. Reorder & Restock Planner */}
      <ReorderListView
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        parts={parts}
        onQuickReceive={(part) => {
          setStockModalPart(part);
          setStockModalMode('STOCK_IN');
          setIsStockModalOpen(true);
        }}
      />

      {/* 6. Transaction History Modal */}
      <TransactionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        transactions={transactions}
      />

      {/* 7. Detailed Part Inspector */}
      <PartDetailModal
        isOpen={!!inspectPart}
        onClose={() => setInspectPart(null)}
        part={inspectPart}
        transactions={transactions}
        onOpenStockModal={(part, type) => {
          setStockModalPart(part);
          setStockModalMode(type);
          setIsStockModalOpen(true);
        }}
        onEditPart={(part) => {
          setPartToEdit(part);
          setIsPartModalOpen(true);
        }}
        onDeletePart={(part) => {
          setPartToDelete(part);
          setIsDeleteModalOpen(true);
        }}
      />

    </div>
  );
}

export default App;
