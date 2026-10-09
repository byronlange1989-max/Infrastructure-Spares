import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Plus, 
  Minus, 
  Edit3, 
  Trash2, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Check,
  PackagePlus,
  PackageMinus,
  Sparkles,
  MapPin
} from 'lucide-react';
import { SparePart, ComponentCategory, StockStatus } from '../types/inventory';
import { CATEGORIES } from '../data/initialData';

interface InventoryTableProps {
  parts: SparePart[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedStatusFilter: StockStatus | null;
  onSelectStatusFilter: (status: StockStatus | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onQuickAdjustQuantity: (part: SparePart, delta: number) => void;
  onOpenStockModal: (part: SparePart, type: 'STOCK_IN' | 'STOCK_OUT') => void;
  onEditPart: (part: SparePart) => void;
  onDeletePart: (part: SparePart) => void;
  onViewDetails: (part: SparePart) => void;
  onBatchDelete?: (ids: string[]) => void;
}

type SortField = 'partNumber' | 'name' | 'quantity' | 'location' | 'unitCost' | 'lastUpdated';
type SortDirection = 'asc' | 'desc';

export const InventoryTable: React.FC<InventoryTableProps> = ({
  parts,
  selectedCategory,
  onSelectCategory,
  selectedStatusFilter,
  onSelectStatusFilter,
  searchQuery,
  onSearchChange,
  onQuickAdjustQuantity,
  onOpenStockModal,
  onEditPart,
  onDeletePart,
  onViewDetails,
  onBatchDelete,
}) => {
  const [sortField, setSortField] = useState<SortField>('partNumber');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedPartNumber, setCopiedPartNumber] = useState<string | null>(null);

  // Sorting handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // Filter parts
  const filteredParts = parts.filter((part) => {
    // Category match
    if (selectedCategory && selectedCategory !== 'ALL' && part.category !== selectedCategory) {
      return false;
    }

    // Status filter match
    if (selectedStatusFilter === 'Out of Stock' && part.quantity !== 0) return false;
    if (selectedStatusFilter === 'Low Stock' && (part.quantity === 0 || part.quantity > part.minStock)) return false;
    if (selectedStatusFilter === 'In Stock' && part.quantity <= part.minStock) return false;

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPartNo = part.partNumber.toLowerCase().includes(q);
      const matchName = part.name.toLowerCase().includes(q);
      const matchLoc = part.location.toLowerCase().includes(q);
      const matchSupp = part.supplier.toLowerCase().includes(q);
      const matchEquip = part.equipment.toLowerCase().includes(q);
      return matchPartNo || matchName || matchLoc || matchSupp || matchEquip;
    }

    return true;
  });

  // Sort filtered parts
  const sortedParts = [...filteredParts].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'partNumber') comparison = a.partNumber.localeCompare(b.partNumber);
    else if (sortField === 'name') comparison = a.name.localeCompare(b.name);
    else if (sortField === 'quantity') comparison = a.quantity - b.quantity;
    else if (sortField === 'location') comparison = a.location.localeCompare(b.location);
    else if (sortField === 'unitCost') comparison = a.unitCost - b.unitCost;
    else if (sortField === 'lastUpdated') comparison = a.lastUpdated.localeCompare(b.lastUpdated);

    return sortDir === 'asc' ? comparison : -comparison;
  });

  // Selection toggle
  const toggleSelectAll = () => {
    if (selectedIds.length === sortedParts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedParts.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCopyPartNumber = (partNo: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(partNo);
    setCopiedPartNumber(partNo);
    setTimeout(() => setCopiedPartNumber(null), 2000);
  };

  // Criticality badge helper
  const getCriticalityBadge = (level: string) => {
    switch (level) {
      case 'High':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            Critical
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-700 text-slate-300">
            Low
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      
      {/* Controls Bar */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by part number, name, location, supplier, equipment..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter badges */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 hidden sm:inline">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => onSelectCategory(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Categories ({parts.length})</option>
                {CATEGORIES.map((cat) => {
                  const count = parts.filter((p) => p.category === cat).length;
                  return (
                    <option key={cat} value={cat}>
                      {cat} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Quick Status pills */}
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => onSelectStatusFilter(null)}
                className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                  selectedStatusFilter === null ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => onSelectStatusFilter(selectedStatusFilter === 'In Stock' ? null : 'In Stock')}
                className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                  selectedStatusFilter === 'In Stock' ? 'bg-emerald-950/80 text-emerald-400 font-medium' : 'text-slate-400 hover:text-emerald-400'
                }`}
              >
                In Stock
              </button>
              <button
                onClick={() => onSelectStatusFilter(selectedStatusFilter === 'Low Stock' ? null : 'Low Stock')}
                className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                  selectedStatusFilter === 'Low Stock' ? 'bg-amber-950/80 text-amber-400 font-medium' : 'text-slate-400 hover:text-amber-400'
                }`}
              >
                Low Stock
              </button>
              <button
                onClick={() => onSelectStatusFilter(selectedStatusFilter === 'Out of Stock' ? null : 'Out of Stock')}
                className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                  selectedStatusFilter === 'Out of Stock' ? 'bg-rose-950/80 text-rose-400 font-medium' : 'text-slate-400 hover:text-rose-400'
                }`}
              >
                Out of Stock
              </button>
            </div>

          </div>

        </div>

        {/* Bulk Action Bar if items selected */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-cyan-950/30 border border-cyan-800/40 rounded-lg px-3.5 py-2 text-xs">
            <span className="text-cyan-300 font-medium">
              {selectedIds.length} {selectedIds.length === 1 ? 'component' : 'components'} selected
            </span>
            <div className="flex items-center gap-2">
              {onBatchDelete && (
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected components?`)) {
                      onBatchDelete(selectedIds);
                      setSelectedIds([]);
                    }
                  }}
                  className="px-2.5 py-1 bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 border border-rose-500/30 rounded font-medium transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Selected
                </button>
              )}
              <button
                onClick={() => setSelectedIds([])}
                className="text-slate-400 hover:text-white px-2 py-1"
              >
                Deselect
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/70 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={sortedParts.length > 0 && selectedIds.length === sortedParts.length}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
              </th>
              
              <th 
                onClick={() => handleSort('partNumber')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Part # / Code</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-500" />
                </div>
              </th>

              <th 
                onClick={() => handleSort('name')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 select-none min-w-[220px]"
              >
                <div className="flex items-center gap-1">
                  <span>Component Details</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-500" />
                </div>
              </th>

              <th className="py-3 px-3 hidden md:table-cell">Category</th>

              <th 
                onClick={() => handleSort('location')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 select-none hidden lg:table-cell"
              >
                <div className="flex items-center gap-1">
                  <span>Location</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-500" />
                </div>
              </th>

              <th 
                onClick={() => handleSort('quantity')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 select-none min-w-[150px]"
              >
                <div className="flex items-center gap-1">
                  <span>Stock on Hand</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-500" />
                </div>
              </th>

              <th className="py-3 px-3 text-center">Status</th>

              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60">
            {sortedParts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Filter className="h-8 w-8 text-slate-600 stroke-[1.5]" />
                    <p className="text-sm font-medium text-slate-300">No components match your filter criteria</p>
                    <p className="text-xs text-slate-500">Try adjusting your search terms or filters above</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedParts.map((part) => {
                const isSelected = selectedIds.includes(part.id);
                const isOutOfStock = part.quantity === 0;
                const isLowStock = !isOutOfStock && part.quantity <= part.minStock;
                const isHealthy = part.quantity > part.minStock;

                return (
                  <tr
                    key={part.id}
                    className={`hover:bg-slate-800/40 transition-colors group ${
                      isSelected ? 'bg-cyan-950/20' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(part.id)}
                        className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                    </td>

                    {/* Part Number */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-cyan-300">
                        <span>{part.partNumber}</span>
                        <button
                          onClick={(e) => handleCopyPartNumber(part.partNumber, e)}
                          title="Copy Part Number"
                          className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity p-0.5 rounded cursor-pointer"
                        >
                          {copiedPartNumber === part.partNumber ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3 text-slate-400" />
                          )}
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {getCriticalityBadge(part.criticality)}
                      </div>
                    </td>

                    {/* Name & Equipment */}
                    <td className="py-3 px-4">
                      <div 
                        onClick={() => onViewDetails(part)}
                        className="font-medium text-slate-100 hover:text-cyan-300 cursor-pointer line-clamp-1 transition-colors"
                      >
                        {part.name}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        {part.equipment && (
                          <span className="text-slate-400">
                            Equip: <span className="text-slate-300">{part.equipment}</span>
                          </span>
                        )}
                        {part.supplier && (
                          <span className="text-slate-500 hidden sm:inline">
                            • {part.supplier}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 hidden md:table-cell">
                      <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {part.category}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-3 hidden lg:table-cell text-xs text-slate-300">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span className="truncate max-w-[140px]" title={part.location}>
                          {part.location || 'Unassigned'}
                        </span>
                      </div>
                    </td>

                    {/* Quantity with Inline Stepper */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        {/* Quick Minus */}
                        <button
                          onClick={() => onQuickAdjustQuantity(part, -1)}
                          disabled={part.quantity <= 0}
                          title="Quick Remove 1 Unit"
                          className="h-6 w-6 rounded bg-slate-800 hover:bg-rose-900/40 hover:text-rose-300 disabled:opacity-30 disabled:hover:bg-slate-800 flex items-center justify-center text-slate-300 transition-colors cursor-pointer border border-slate-700"
                        >
                          <Minus className="h-3 w-3" />
                        </button>

                        {/* Quantity Number */}
                        <div className="text-center min-w-[50px]">
                          <span className={`font-mono text-sm font-bold ${
                            isOutOfStock ? 'text-rose-400' : isLowStock ? 'text-amber-300' : 'text-emerald-400'
                          }`}>
                            {part.quantity}
                          </span>
                          <span className="text-[11px] text-slate-500 ml-1">{part.unit}</span>
                          
                          <div className="text-[10px] text-slate-500">
                            min: {part.minStock}
                          </div>
                        </div>

                        {/* Quick Plus */}
                        <button
                          onClick={() => onQuickAdjustQuantity(part, 1)}
                          title="Quick Add 1 Unit"
                          className="h-6 w-6 rounded bg-slate-800 hover:bg-emerald-900/40 hover:text-emerald-300 flex items-center justify-center text-slate-300 transition-colors cursor-pointer border border-slate-700"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 text-center">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          <XCircle className="h-3 w-3" />
                          Out
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <AlertTriangle className="h-3 w-3" />
                          Low
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3" />
                          OK
                        </span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        
                        {/* Stock In (Receive) */}
                        <button
                          onClick={() => onOpenStockModal(part, 'STOCK_IN')}
                          title="Stock In / Receive"
                          className="p-1.5 text-emerald-400 hover:bg-emerald-950/50 rounded-lg transition-colors cursor-pointer"
                        >
                          <PackagePlus className="h-4 w-4" />
                        </button>

                        {/* Stock Out (Issue/Use) */}
                        <button
                          onClick={() => onOpenStockModal(part, 'STOCK_OUT')}
                          title="Stock Out / Issue"
                          className="p-1.5 text-amber-400 hover:bg-amber-950/50 rounded-lg transition-colors cursor-pointer"
                        >
                          <PackageMinus className="h-4 w-4" />
                        </button>

                        {/* Inspect Details */}
                        <button
                          onClick={() => onViewDetails(part)}
                          title="View Details & Specs"
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => onEditPart(part)}
                          title="Edit Component Details"
                          className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                        {/* Delete / Remove */}
                        <button
                          onClick={() => onDeletePart(part)}
                          title="Remove Component"
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="py-3 px-4 bg-slate-950/50 border-t border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          Showing <span className="font-semibold text-slate-200">{sortedParts.length}</span> of{' '}
          <span className="font-semibold text-slate-200">{parts.length}</span> total components
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span>Healthy Stock</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400"></span>
            <span>Low Stock (&le; min)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-400"></span>
            <span>Out of Stock</span>
          </div>
        </div>
      </div>

    </div>
  );
};
