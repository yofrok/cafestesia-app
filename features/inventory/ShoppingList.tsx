
import React, { useState } from 'react';
import { InventoryItem, Provider } from '../../types';
import Icon from '../../components/Icon';
import StockUpdateModal from './StockUpdateModal';
import { useInventory } from '../../services/useInventory';
import CollapsibleSection from '../../components/CollapsibleSection';

interface ShoppingListProps {
    items: InventoryItem[];
    onRecordStockChange: ReturnType<typeof useInventory>['recordStockChange'];
    providers: Provider[];
}

const ShoppingList: React.FC<ShoppingListProps> = ({ items, onRecordStockChange, providers }) => {
    const [stockModalItem, setStockModalItem] = useState<InventoryItem | null>(null);
    
    // Calculate items to buy
    const itemsToBuy = items.filter(item => item.currentStock <= item.minStock);

    // Group by Provider
    const itemsByProvider = itemsToBuy.reduce((acc: Record<string, InventoryItem[]>, item) => {
        const provider = item.providerPreferido || 'Sin Proveedor';
        if (!acc[provider]) acc[provider] = [];
        acc[provider].push(item);
        return acc;
    }, {});

    const sortedProviders = Object.keys(itemsByProvider).sort((a, b) => {
        if (a === 'Sin Proveedor') return 1;
        if (b === 'Sin Proveedor') return -1;
        return a.localeCompare(b);
    });

    if (itemsToBuy.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-green-100 p-4 rounded-full mb-4">
                    <Icon name="check-circle" size={48} className="text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">¡Todo en orden!</h3>
                <p className="text-gray-500">No hay productos por debajo del stock mínimo.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-20">
            {/* Summary Card */}
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-4">
                <div className="bg-white p-2 rounded-full shadow-sm">
                    <Icon name="shopping-cart" className="text-red-500" size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-red-800 text-lg">Lista de Compras Activa</h3>
                    <p className="text-red-600 text-sm">{itemsToBuy.length} productos requieren reabastecimiento.</p>
                </div>
            </div>

            {sortedProviders.map(providerName => (
                <CollapsibleSection 
                    key={providerName} 
                    title={providerName} 
                    count={itemsByProvider[providerName].length}
                    icon="store"
                    colorClass="text-gray-800"
                    bgClass="bg-white"
                >
                    <div className="space-y-3">
                        {itemsByProvider[providerName].map(item => (
                            <div key={item.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                <div>
                                    <p className="font-bold text-gray-800">{item.name}</p>
                                    <div className="flex items-center gap-2 text-sm mt-1">
                                        <span className="text-red-600 font-bold bg-red-100 px-2 py-0.5 rounded">
                                            Quedan: {item.currentStock} {item.unit}
                                        </span>
                                        <span className="text-gray-500">
                                            (Mín: {item.minStock} {item.unit})
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setStockModalItem(item)}
                                    className="flex-shrink-0 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm shadow-sm active:scale-95"
                                >
                                    <Icon name="plus-circle" size={16} />
                                    Comprar
                                </button>
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>
            ))}

            {stockModalItem && (
                <StockUpdateModal
                    isOpen={!!stockModalItem}
                    onClose={() => setStockModalItem(null)}
                    item={stockModalItem}
                    isAdding={true}
                    onUpdate={onRecordStockChange}
                    providers={providers}
                />
            )}
        </div>
    );
};

export default ShoppingList;
