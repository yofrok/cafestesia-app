
import React, { useState, useMemo } from 'react';
import Icon from '../../components/Icon';
import { useInventory } from '../../services/useInventory';
import InventoryList from './InventoryList';
import ShoppingList from './ShoppingList';
import ProductFormModal from './ProductFormModal';
import StockHistoryLog from './StockHistoryLog'; // Import
import { InventoryItem, Provider, Category } from '../../types';

type InventoryView = 'general' | 'shopping-list';

interface InventoryScreenProps {
    inventoryHook: ReturnType<typeof useInventory>;
    providers: Provider[];
    categories: Category[];
}

const InventoryScreen: React.FC<InventoryScreenProps> = ({ inventoryHook, providers, categories }) => {
    const { items, addItem, updateItem, deleteItem, recordStockChange, stockLogs } = inventoryHook;
    const [activeView, setActiveView] = useState<InventoryView>('general');
    const [search, setSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [showHistory, setShowHistory] = useState(false);

    const handleEdit = (item: InventoryItem) => {
        setEditingItem(item);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingItem(null);
        setIsFormOpen(true);
    };
    
    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingItem(null);
    }

    const handleSaveItem = (itemData: Omit<InventoryItem, 'id' | 'purchaseHistory'> | InventoryItem) => {
        if ('id' in itemData) {
            updateItem(itemData);
        } else {
            addItem(itemData);
        }
    };

    const filteredItems = useMemo(() => items.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
    ), [items, search]);

    // Statistics
    const lowStockCount = useMemo(() => items.filter(i => i.currentStock <= i.minStock).length, [items]);

    const TabButton: React.FC<{ view: InventoryView, label: string, icon: 'boxes' | 'shopping-cart', badge?: number }> = ({ view, label, icon, badge }) => (
        <button
            onClick={() => setActiveView(view)}
            className={`relative flex items-center gap-2 py-3 px-4 text-sm md:text-base font-bold border-b-4 transition-colors ${activeView === view ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
        >
            <Icon name={icon} size={18} />
            {label}
            {badge !== undefined && badge > 0 && (
                <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{badge}</span>
            )}
        </button>
    );
    
    if (showHistory) {
        return <StockHistoryLog logs={stockLogs} onClose={() => setShowHistory(false)} />;
    }

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200 flex-shrink-0">
                <div className="p-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Inventario</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {items.length} productos totales • {lowStockCount} alertas
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowHistory(true)}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                            title="Ver Historial"
                        >
                            <Icon name="list" size={20} />
                        </button>
                        <button onClick={handleAddNew} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm shadow-sm">
                            <Icon name="plus-circle" size={18} />
                            <span className="hidden sm:inline">Nuevo Producto</span>
                        </button>
                    </div>
                </div>
                
                <div className="flex px-4 gap-1 overflow-x-auto">
                    <TabButton view="general" label="General" icon="boxes" />
                    <TabButton view="shopping-list" label="Lista de Compras" icon="shopping-cart" badge={lowStockCount} />
                </div>
            </div>

            {/* Search Bar */}
            <div className="p-4 bg-gray-50 flex-shrink-0">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Icon name="list" size={20} />
                    </div>
                    <input
                        type="search"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nombre..."
                        className="w-full p-3 pl-4 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-shadow"
                    />
                </div>
            </div>
            
            <div className="flex-grow overflow-y-auto px-4 pb-4">
                {activeView === 'general' ? (
                    <InventoryList 
                        items={filteredItems} 
                        onEdit={handleEdit} 
                        onRecordStockChange={recordStockChange}
                        providers={providers}
                    />
                ) : (
                    <ShoppingList 
                        items={filteredItems} 
                        onRecordStockChange={recordStockChange}
                        providers={providers}
                    />
                )}
            </div>

            <ProductFormModal
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                onSave={handleSaveItem}
                onDelete={deleteItem}
                item={editingItem}
                providers={providers}
                categories={categories}
            />
        </div>
    );
};

export default InventoryScreen;
