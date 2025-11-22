
import React, { useState, useMemo } from 'react';
import { useInventory } from '../../services/useInventory';
import { useRecipes } from '../../services/useRecipes';
import { useUsers } from '../../services/useUsers';
import { InventoryItem, ProductionProcess, Recipe } from '../../types';
import Icon from '../../components/Icon';
import ProductionCompletionModal from '../baking/ProductionCompletionModal';
import StockUpdateModal from './StockUpdateModal';

interface KitchenStockDashboardProps {
    inventoryHook: ReturnType<typeof useInventory>;
    recipesHook: ReturnType<typeof useRecipes>;
    usersHook: ReturnType<typeof useUsers>;
}

const KitchenStockDashboard: React.FC<KitchenStockDashboardProps> = ({ inventoryHook, recipesHook, usersHook }) => {
    const { items, recordStockChange, produceBatch } = inventoryHook;
    const { recipes } = recipesHook;
    const { users } = usersHook;

    const [produceModalProcess, setProduceModalProcess] = useState<ProductionProcess | null>(null);
    const [stockModalItem, setStockModalItem] = useState<{ item: InventoryItem, isAdding: boolean } | null>(null);

    // Group items by station
    const { marketItems, prepItems, pantryItems } = useMemo(() => {
        return items.reduce((acc, item) => {
            if (item.kitchenStation === 'market') acc.marketItems.push(item);
            else if (item.kitchenStation === 'prep') acc.prepItems.push(item);
            else if (item.kitchenStation === 'pantry') acc.pantryItems.push(item);
            return acc;
        }, { marketItems: [] as InventoryItem[], prepItems: [] as InventoryItem[], pantryItems: [] as InventoryItem[] });
    }, [items]);

    // Helper to find linked recipe for a PREP item
    const getLinkedRecipe = (item: InventoryItem): Recipe | undefined => {
        return recipes.find(r => r.outputInventoryItemId === item.id);
    };

    const handleProduceClick = (item: InventoryItem) => {
        const recipe = getLinkedRecipe(item);
        if (!recipe) return;

        // Create a dummy process object to satisfy the modal props
        const dummyProcess: ProductionProcess = {
            id: `quick-prod-${Date.now()}`,
            name: recipe.name,
            type: 'baking', // Using baking type as generic production
            recipe: recipe,
            recipeId: recipe.id,
            state: 'finished', // Already done
            currentStepIndex: 0,
            steps: [],
            totalTime: 0,
            totalTimeLeft: 0,
            stepTimeLeft: 0,
            lastTickTimestamp: Date.now()
        };
        setProduceModalProcess(dummyProcess);
    };

    const handleConfirmProduction = (process: ProductionProcess, actualQuantity: number, responsible: string) => {
        if (process.recipe) {
            let multiplier = 1;
            if (process.recipe.outputQuantity && process.recipe.outputQuantity > 0) {
                multiplier = actualQuantity / process.recipe.outputQuantity;
            }
            produceBatch(process.recipe, multiplier, actualQuantity, responsible);
            setProduceModalProcess(null);
        }
    };

    const ItemCard: React.FC<{ item: InventoryItem, theme: 'market' | 'prep' | 'pantry' }> = ({ item, theme }) => {
        const isLow = item.currentStock <= item.minStock;
        const linkedRecipe = theme === 'prep' ? getLinkedRecipe(item) : undefined;

        const themeClasses = {
            market: { border: 'border-green-200', bg: 'bg-white', text: 'text-green-800', icon: 'shopping-cart' },
            prep: { border: 'border-red-200', bg: 'bg-white', text: 'text-red-800', icon: 'thermometer' },
            pantry: { border: 'border-blue-200', bg: 'bg-white', text: 'text-blue-800', icon: 'archive' },
        }[theme];

        return (
            <div className={`p-3 rounded-lg border shadow-sm flex flex-col gap-2 ${themeClasses.bg} ${themeClasses.border} ${isLow ? 'ring-2 ring-red-400' : ''}`}>
                <div className="flex justify-between items-start">
                    <div>
                        <p className={`font-bold text-sm ${themeClasses.text}`}>{item.name}</p>
                        <p className="text-xs text-gray-500">{item.currentStock.toFixed(2)} {item.unit} <span className="text-gray-400 mx-1">/</span> min: {item.minStock}</p>
                    </div>
                    {isLow && <Icon name="alert-triangle" className="text-red-500" size={16} />}
                </div>

                <div className="flex gap-2 mt-1">
                    {theme === 'market' && isLow && (
                        <button 
                            onClick={() => setStockModalItem({item, isAdding: true})}
                            className="flex-1 bg-green-100 text-green-700 text-xs font-bold py-1.5 px-2 rounded hover:bg-green-200 flex items-center justify-center gap-1"
                        >
                            <Icon name="shopping-cart" size={12} /> Comprar
                        </button>
                    )}
                    
                    {theme === 'prep' && linkedRecipe && (
                        <button 
                            onClick={() => handleProduceClick(item)}
                            className="flex-1 bg-red-100 text-red-700 text-xs font-bold py-1.5 px-2 rounded hover:bg-red-200 flex items-center justify-center gap-1"
                        >
                            <Icon name="play-circle" size={12} /> Producir
                        </button>
                    )}

                    {theme === 'pantry' && (
                         <button 
                            onClick={() => setStockModalItem({item, isAdding: false})}
                            className="flex-1 bg-blue-100 text-blue-700 text-xs font-bold py-1.5 px-2 rounded hover:bg-blue-200 flex items-center justify-center gap-1"
                        >
                            <Icon name="minus" size={12} /> Usar
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
            <div className="flex-grow overflow-x-auto">
                <div className="flex h-full min-w-[900px] p-4 gap-4">
                    
                    {/* COL 1: Market (Frescos) */}
                    <div className="flex-1 flex flex-col bg-green-50/50 rounded-xl border border-green-100 overflow-hidden">
                        <div className="p-3 bg-green-100/50 border-b border-green-200 flex items-center gap-2">
                            <Icon name="store" className="text-green-600" size={20} />
                            <div>
                                <h3 className="font-bold text-green-900">1. Mercado (Frescos)</h3>
                                <p className="text-[10px] text-green-700">Compra Diaria / Semanal</p>
                            </div>
                            <span className="ml-auto bg-white text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">{marketItems.length}</span>
                        </div>
                        <div className="p-3 overflow-y-auto flex-grow space-y-2">
                            {marketItems.map(item => <ItemCard key={item.id} item={item} theme="market" />)}
                            {marketItems.length === 0 && <p className="text-center text-sm text-green-400 italic mt-4">Sin items asignados a Mercado</p>}
                        </div>
                    </div>

                    {/* COL 2: Prep (Producción) */}
                    <div className="flex-1 flex flex-col bg-red-50/50 rounded-xl border border-red-100 overflow-hidden">
                        <div className="p-3 bg-red-100/50 border-b border-red-200 flex items-center gap-2">
                            <Icon name="thermometer" className="text-red-600" size={20} />
                            <div>
                                <h3 className="font-bold text-red-900">2. Prep / Mise en Place</h3>
                                <p className="text-[10px] text-red-700">Salsas, Rellenos, Cocciones</p>
                            </div>
                            <span className="ml-auto bg-white text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">{prepItems.length}</span>
                        </div>
                        <div className="p-3 overflow-y-auto flex-grow space-y-2">
                            {prepItems.map(item => <ItemCard key={item.id} item={item} theme="prep" />)}
                            {prepItems.length === 0 && <p className="text-center text-sm text-red-400 italic mt-4">Sin items asignados a Prep</p>}
                        </div>
                    </div>

                    {/* COL 3: Pantry (Almacén) */}
                    <div className="flex-1 flex flex-col bg-blue-50/50 rounded-xl border border-blue-100 overflow-hidden">
                        <div className="p-3 bg-blue-100/50 border-b border-blue-200 flex items-center gap-2">
                            <Icon name="archive" className="text-blue-600" size={20} />
                            <div>
                                <h3 className="font-bold text-blue-900">3. Almacén / Secos</h3>
                                <p className="text-[10px] text-blue-700">Stock de seguridad</p>
                            </div>
                            <span className="ml-auto bg-white text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{pantryItems.length}</span>
                        </div>
                        <div className="p-3 overflow-y-auto flex-grow space-y-2">
                            {pantryItems.map(item => <ItemCard key={item.id} item={item} theme="pantry" />)}
                            {pantryItems.length === 0 && <p className="text-center text-sm text-blue-400 italic mt-4">Sin items asignados a Almacén</p>}
                        </div>
                    </div>

                </div>
            </div>

            {/* Modals */}
            {produceModalProcess && (
                <ProductionCompletionModal 
                    isOpen={!!produceModalProcess}
                    onClose={() => setProduceModalProcess(null)}
                    process={produceModalProcess}
                    users={users}
                    onConfirm={handleConfirmProduction}
                />
            )}

            {stockModalItem && (
                <StockUpdateModal 
                    isOpen={!!stockModalItem}
                    onClose={() => setStockModalItem(null)}
                    item={stockModalItem.item}
                    isAdding={stockModalItem.isAdding}
                    onUpdate={recordStockChange}
                    providers={[]} // Not strictly needed here for quick updates
                />
            )}
        </div>
    );
};

export default KitchenStockDashboard;
