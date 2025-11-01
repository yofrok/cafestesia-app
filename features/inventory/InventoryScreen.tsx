import React, { useState, useMemo } from 'react';
import Icon from '../../components/Icon';
import { useInventory } from '../../services/useInventory';
import InventoryList from './InventoryList';
import ShoppingList from './ShoppingList';
import ProductFormModal from './ProductFormModal';
import { InventoryItem, Provider, Category } from '../../types';

type InventoryView = 'general' | 'shopping-list';

interface InventoryScreenProps {
    inventoryHook: ReturnType<typeof useInventory>;
    providers: Provider[];
    categories: Category[];
}

const InventoryScreen: React.FC<InventoryScreenProps> = ({ inventoryHook, providers, categories }) => {
    const { items, addItem, updateItem, deleteItem, recordStockChange } = inventoryHook;
    const [activeView, setActiveView] = useState<InventoryView>('general');
    const [search, setSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

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

    const TabButton: React.FC<{ view: InventoryView, label: string, icon: 'boxes' | 'shopping-cart' }> = ({ view, label, icon }) => (
        <button
            onClick={() => setActiveView(view)}
            className={`flex items-center gap-2 py-2 px-4 text-sm md:text-base font-bold border-b-4 transition-colors ${activeView === view ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
            <Icon name={icon} size={18} />
            {label}
        </button>
    );

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="operations-header flex flex-col md:flex-row md:flex-wrap justify-between items-center p-4 border-b border-gray-200 gap-4 flex-shrink-0">
                <div className="operations-actions">
                    <button onClick={handleAddNew} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                        <Icon name="plus-circle" size={16} />
                        Añadir Producto
                    </button>
                </div>
                <div className="inventory-tabs flex gap-4">
                    <TabButton view="general" label="Inventario General" icon="boxes" />
                    <TabButton view="shopping-list" label="Lista de Compras" icon="shopping-cart" />
                </div>
            </div>

            <div className="search-bar-container p-4 flex-shrink-0">
                <input
                    type="search"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar producto..."
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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