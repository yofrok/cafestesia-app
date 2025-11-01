import React, { useState } from 'react';
import { InventoryItem, Provider } from '../../types';
import Icon from '../../components/Icon';
import StockUpdateModal from './StockUpdateModal';
import { useInventory } from '../../services/useInventory';

interface ShoppingListProps {
    items: InventoryItem[];
    onRecordStockChange: ReturnType<typeof useInventory>['recordStockChange'];
    providers: Provider[];
}

const ShoppingList: React.FC<ShoppingListProps> = ({ items, onRecordStockChange, providers }) => {
    const [stockModalItem, setStockModalItem] = useState<InventoryItem | null>(null);
    const itemsToBuy = items.filter(item => item.currentStock <= item.minStock);

    if (itemsToBuy.length === 0) {
        return <p className="text-center text-gray-500 mt-8">¡Todo en orden! No hay nada en la lista de compras.</p>;
    }

    // FIX: Explicitly type the accumulator ('acc') in the reduce function to resolve the "Untyped function calls may not accept type arguments" error.
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

    return (
        <div className="space-y-6">
            {sortedProviders.map(providerName => (
                <div key={providerName}>
                    <h3 className="text-lg font-bold text-blue-700 pb-2 border-b border-gray-300 mb-4 flex items-center gap-2">
                        <Icon name="store" size={20} />
                        {providerName}
                    </h3>
                    <div className="space-y-3">
                        {itemsByProvider[providerName].map(item => (
                            <div key={item.id} className="p-4 bg-red-50 border border-red-300 rounded-lg flex flex-col md:flex-row justify-between md:items-center gap-3">
                                <div>
                                    <p className="font-bold">{item.name}</p>
                                    <p className="text-sm text-red-700 font-semibold">
                                        Quedan: {item.currentStock} {item.unit} (Mín: {item.minStock} {item.unit})
                                    </p>
                                </div>
                                <button
                                    onClick={() => setStockModalItem(item)}
                                    className="flex-shrink-0 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm self-start md:self-center"
                                >
                                    <Icon name="plus-circle" size={16} />
                                    Registrar Compra
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
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