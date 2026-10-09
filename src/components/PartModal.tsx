import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, Save, PlusCircle } from 'lucide-react';
import { SparePart, ComponentCategory, CriticalityLevel } from '../types/inventory';
import { CATEGORIES } from '../data/initialData';

interface PartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (partData: Omit<SparePart, 'id' | 'lastUpdated'>, existingId?: string) => void;
  partToEdit?: SparePart | null;
}

export const PartModal: React.FC<PartModalProps> = ({
  isOpen,
  onClose,
  onSave,
  partToEdit,
}) => {
  const [partNumber, setPartNumber] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ComponentCategory>('Mechanical');
  const [quantity, setQuantity] = useState<number>(10);
  const [minStock, setMinStock] = useState<number>(5);
  const [unit, setUnit] = useState('pcs');
  const [location, setLocation] = useState('');
  const [unitCost, setUnitCost] = useState<number>(0);
  const [supplier, setSupplier] = useState('');
  const [equipment, setEquipment] = useState('');
  const [criticality, setCriticality] = useState<CriticalityLevel>('Medium');
  const [specs, setSpecs] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Populate when editing
  useEffect(() => {
    if (partToEdit) {
      setPartNumber(partToEdit.partNumber);
      setName(partToEdit.name);
      setCategory(partToEdit.category);
      setQuantity(partToEdit.quantity);
      setMinStock(partToEdit.minStock);
      setUnit(partToEdit.unit);
      setLocation(partToEdit.location);
      setUnitCost(partToEdit.unitCost);
      setSupplier(partToEdit.supplier);
      setEquipment(partToEdit.equipment);
      setCriticality(partToEdit.criticality);
      setSpecs(partToEdit.specs || '');
      setNotes(partToEdit.notes || '');
    } else {
      // Defaults for new part
      setPartNumber('');
      setName('');
      setCategory('Mechanical');
      setQuantity(10);
      setMinStock(5);
      setUnit('pcs');
      setLocation('');
      setUnitCost(0);
      setSupplier('');
      setEquipment('');
      setCriticality('Medium');
      setSpecs('');
      setNotes('');
    }
    setError(null);
  }, [partToEdit, isOpen]);

  if (!isOpen) return null;

  // Auto generate part number helper
  const handleAutoGeneratePartNo = () => {
    const prefixMap: Record<ComponentCategory, string> = {
      'Mechanical': 'MEC',
      'Electrical': 'ELC',
      'Pneumatics & Hydraulics': 'PNE',
      'Sensors & Instrumentation': 'SEN',
      'Fasteners & Hardware': 'FST',
      'Belts & Pulleys': 'BLT',
      'Bearings & Seals': 'BRG',
      'Motors & Drives': 'MTR',
      'Filters & Lubricants': 'FLT',
      'General Spares': 'SPR',
    };
    const prefix = prefixMap[category] || 'PRT';
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setPartNumber(`${prefix}-${randomNum}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partNumber.trim()) {
      setError('Part Number / SKU is required');
      return;
    }
    if (!name.trim()) {
      setError('Component Name is required');
      return;
    }

    onSave(
      {
        partNumber: partNumber.trim().toUpperCase(),
        name: name.trim(),
        category,
        quantity: Math.max(0, Number(quantity) || 0),
        minStock: Math.max(0, Number(minStock) || 0),
        unit: unit.trim() || 'pcs',
        location: location.trim() || 'Unassigned',
        unitCost: Math.max(0, Number(unitCost) || 0),
        supplier: supplier.trim() || 'General Supplier',
        equipment: equipment.trim() || 'General Plant',
        criticality,
        specs: specs.trim(),
        notes: notes.trim(),
      },
      partToEdit ? partToEdit.id : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              {partToEdit ? <Save className="h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {partToEdit ? 'Edit Spare Component' : 'Add New Spare Component'}
              </h2>
              <p className="text-xs text-slate-400">
                {partToEdit ? `Updating ${partToEdit.partNumber}` : 'Enter component specifications and stock parameters'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: Part Number & Name */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Part # / SKU <span className="text-rose-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAutoGeneratePartNo}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="h-3 w-3" />
                  Auto
                </button>
              </div>
              <input
                type="text"
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                placeholder="e.g. BRG-6204-2RS"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300 uppercase focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Component Name / Description <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. SKF Deep Groove Ball Bearing 20x47x14mm"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          </div>

          {/* Row 2: Category & Criticality */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category / Classification
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ComponentCategory)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Criticality to Production
              </label>
              <select
                value={criticality}
                onChange={(e) => setCriticality(e.target.value as CriticalityLevel)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="High">High (Immediate Plant / Line Stopper)</option>
                <option value="Medium">Medium (Affects Redundancy / Minor Impact)</option>
                <option value="Low">Low (Standard consumable or non-critical)</option>
              </select>
            </div>
          </div>

          {/* Row 3: Stock Quantity, Min Stock, Unit */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Quantity on Hand
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Min Stock Alert Level
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={minStock}
                onChange={(e) => setMinStock(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono text-amber-300 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Unit of Measure
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="pcs">pcs (Pieces)</option>
                <option value="boxes">boxes</option>
                <option value="meters">meters (m)</option>
                <option value="kg">kg (Kilograms)</option>
                <option value="sets">sets</option>
                <option value="rolls">rolls</option>
                <option value="liters">liters (L)</option>
              </select>
            </div>
          </div>

          {/* Row 4: Location & Supplier */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Storage Bin / Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Aisle 2 - Shelf B3"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Supplier / Manufacturer
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="e.g. SKF, Festo, Omron"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Row 5: Machine / Equipment */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Applicable Machine / Equipment
            </label>
            <input
              type="text"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="e.g. Conveyor CV-101, Packaging Cell 3"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Row 6: Specs & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Technical Specifications
              </label>
              <textarea
                rows={2}
                value={specs}
                onChange={(e) => setSpecs(e.target.value)}
                placeholder="Dimensions, voltage, torque, operating limits..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Storage Notes / Lead Time
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Lead time 2 weeks, shelf life, mounting instructions..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
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
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              {partToEdit ? 'Save Changes' : 'Add Component to Inventory'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
