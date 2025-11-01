import React, { useState } from 'react';
import { InventoryItem, Provider } from '../../types';
import { useInventory } from '../../services/useInventory';
import StockUpdateModal from './StockUpdateModal';
import InventoryItemCard from './InventoryItemCard';
import PriceHistoryModal from './PriceHistoryModal';

interface InventoryListProps {
    items: InventoryItem[];
    onEdit: (item: InventoryItem) => void;
    onRecordStockChange: ReturnType<typeof useInventory>['recordStockChange'];
    providers: Provider[];
}

const InventoryList: React.FC<InventoryListProps> = ({ items, onEdit, onRecordStockChange, providers }) => {
    const [stockModal, setStockModal] = useState<{item: InventoryItem, isAdding: boolean} | null>(null);
    const [historyModalItem, setHistoryModalItem] = useState<InventoryItem | null>(null);

    if (items.length === 0) {
        return <p className="text-center text-gray-500 mt-8">No se encontraron productos.</p>;
    }

    // FIX: Explicitly type the accumulator ('acc') in the reduce function to resolve the "Untyped function calls may not accept type arguments" error.
    const categories = items.reduce((acc: Record<string, InventoryItem[]>, item) => {
        const category = item.category || 'Sin Categoría';
        if (!acc[category]) acc[category] = [];
        acc[category].push(item);
        return acc;
    }, {});
    
    const sortedCategories = Object.keys(categories).sort();

    return (
        <div className="space-y-6">
            {sortedCategories.map(categoryName => (
                <div key={categoryName}>
                    <h3 className="text-lg font-bold text-blue-700 pb-2 border-b border-gray-300 mb-4">
                        {categoryName}
                    </h3>
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
                </div>
            ))}
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