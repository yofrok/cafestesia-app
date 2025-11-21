
import React, { useState, useMemo } from 'react';
import { InventoryItem, Provider } from '../../types';
import { useInventory } from '../../services/useInventory';
import StockUpdateModal from './StockUpdateModal';
import InventoryItemCard from './InventoryItemCard';
import PriceHistoryModal from './PriceHistoryModal';
import CollapsibleSection from '../../components/CollapsibleSection';
import Icon from '../../components/Icon';

interface InventoryListProps {
    items: InventoryItem[];
    onEdit: (item: InventoryItem) => void;
    onRecordStockChange: ReturnType<typeof useInventory>['recordStockChange'];
    providers: Provider[];
}

type SortOption = 'name' | 'stockAsc' | 'stockDesc';

const InventoryList: React.FC<InventoryListProps> = ({ items, onEdit, onRecordStockChange, providers }) => {
    const [stockModal, setStockModal] = useState<{item: InventoryItem, isAdding: boolean} | null>(null);
    const [historyModalItem, setHistoryModalItem] = useState<InventoryItem | null>(null);
    
    // Local state for sorting and filtering
    const [sortBy, setSortBy] = useState<SortOption>('name');
    const [providerFilter, setProviderFilter] = useState<string>('all');

    // 1. Filter Items
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            if (providerFilter === 'all') return true;
            // Handle items without explicit provider
            const p = item.providerPreferido || 'Sin Proveedor';
            return p === providerFilter;
        });
    }, [items, providerFilter]);

    // 2. Sort Items (Global Sort before grouping)
    const sortedItems = useMemo(() => {
        const sorted = [...filteredItems];
        switch (sortBy) {
            case 'name':
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'stockAsc':
                sorted.sort((a, b) => (a.currentStock / (a.minStock || 1)) - (b.currentStock / (b.minStock || 1))); // Sort by relative health
                break;
            case 'stockDesc':
                sorted.sort((a, b) => b.currentStock - a.currentStock);
                break;
        }
        return sorted;
    }, [filteredItems, sortBy]);

    // 3. Group by Category
    const categories = useMemo(() => {
        return sortedItems.reduce((acc: Record<string, InventoryItem[]>, item) => {
            const category = item.category || 'Sin Categoría';
            if (!acc[category]) acc[category] = [];
            acc[category].push(item);
            return acc;
        }, {});
    }, [sortedItems]);
    
    const sortedCategoryNames = Object.keys(categories).sort();

    if (items.length === 0) {
        return <p className="text-center text-gray-500 mt-8">No se encontraron productos.</p>;
    }

    return (
        <div className="space-y-4">
            {/* Controls Toolbar */}
            <div className="flex flex-col md:flex-row gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm sticky top-0 z-20">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ordenar por</label>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setSortBy('name')}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium border transition-colors ${sortBy === 'name' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600'}`}
                        >
                            A-Z
                        </button>
                        <button 
                            onClick={() => setSortBy('stockAsc')}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium border transition-colors ${sortBy === 'stockAsc' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600'}`}
                        >
                            Stock Bajo
                        </button>
                    </div>
                </div>
                
                <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Filtrar Proveedor</label>
                    <div className="relative">
                        <select 
                            value={providerFilter}
                            onChange={(e) => setProviderFilter(e.target.value)}
                            className="w-full py-1.5 pl-2 pr-8 rounded-lg text-sm border border-gray-200 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 appearance-none"
                        >
                            <option value="all">Todos los Proveedores</option>
                            {providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                            <option value="Sin Proveedor">Sin Proveedor</option>
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            <Icon name="chevron-right" size={14} className="rotate-90" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Categories List */}
            <div className="space-y-4 pb-20">
                {sortedCategoryNames.map(categoryName => (
                    <CollapsibleSection 
                        key={categoryName} 
                        title={categoryName} 
                        count={categories[categoryName].length}
                        colorClass="text-blue-800"
                        bgClass="bg-blue-50/50"
                    >
                        <div className="space-y-3">
                            {categories[categoryName].map(item => (
                                <InventoryItemCard 
                                    key={item.id} 
                                    item={item} 
                                    onEdit={onEdit} 
                                    onAddStock={() => setStockModal({item, isAdding: true})}
                                    onUseStock={() => setStockModal({item, isAdding: false})}
                                    onViewHistory={() => setHistoryModalItem(item)}
                                />
                            ))}
                        </div>
                    </CollapsibleSection>
                ))}
                
                {sortedCategoryNames.length === 0 && (
                    <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed">
                        <p className="text-gray-500">No hay productos que coincidan con los filtros.</p>
                    </div>
                )}
            </div>

            {stockModal && (
                 <StockUpdateModal
                    isOpen={!!stockModal}
                    onClose={() => setStockModal(null)}
                    item={stockModal.item}
                    isAdding={stockModal.isAdding}
                    onUpdate={onRecordStockChange}
                    providers={providers}
                />
            )}
            {historyModalItem && (
                <PriceHistoryModal
                    isOpen={!!historyModalItem}
                    onClose={() => setHistoryModalItem(null)}
                    item={historyModalItem}
                />
            )}
        </div>
    );
};

export default InventoryList;
