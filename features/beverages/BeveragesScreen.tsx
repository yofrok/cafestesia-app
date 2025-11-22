
import React, { useState } from 'react';
import BeveragePOS from './BeveragePOS';
import BeverageKDS from './BeverageKDS';
import KitchenStockDashboard from '../inventory/KitchenStockDashboard';
import Icon from '../../components/Icon';
import { useInventory } from '../../services/useInventory';
import { useRecipes } from '../../services/useRecipes';
import { useUsers } from '../../services/useUsers';

interface BeveragesScreenProps {
    inventoryHook: ReturnType<typeof useInventory>;
    onToggleSidebar?: () => void;
    recipesHook?: ReturnType<typeof useRecipes>; // Made optional for backward compat, but should be passed
    usersHook?: ReturnType<typeof useUsers>;
}

const BeveragesScreen: React.FC<BeveragesScreenProps> = ({ inventoryHook, onToggleSidebar, recipesHook, usersHook }) => {
    const [view, setView] = useState<'pos' | 'kds-bar' | 'kds-kitchen' | 'stock-kitchen'>('pos');

    return (
        <div className="flex flex-col h-full">
            {/* Header Navigation */}
            <header className="flex-shrink-0 bg-white border-b border-gray-200 p-2 flex items-center gap-2">
                {/* Hamburger Menu for Zen Mode */}
                {onToggleSidebar && (
                    <button 
                        onClick={onToggleSidebar}
                        className="p-2 mr-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Abrir Menú"
                    >
                        <Icon name="menu" size={24} />
                    </button>
                )}

                <div className="flex-grow overflow-x-auto flex justify-center custom-scrollbar">
                    <div className="flex gap-2 min-w-max px-2">
                        <button 
                            onClick={() => setView('pos')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-full font-bold transition-all text-sm whitespace-nowrap ${view === 'pos' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            <Icon name="plus-circle" size={16} />
                            POS
                        </button>
                        <div className="w-px bg-gray-300 mx-1 h-6 self-center hidden sm:block"></div>
                        <button 
                            onClick={() => setView('kds-bar')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-full font-bold transition-all text-sm whitespace-nowrap ${view === 'kds-bar' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            <Icon name="star" size={16} />
                            KDS Barra
                        </button>
                        <button 
                            onClick={() => setView('kds-kitchen')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-full font-bold transition-all text-sm whitespace-nowrap ${view === 'kds-kitchen' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            <Icon name="cake-slice" size={16} />
                            KDS Cocina
                        </button>
                        <button 
                            onClick={() => setView('stock-kitchen')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-full font-bold transition-all text-sm whitespace-nowrap ${view === 'stock-kitchen' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            <Icon name="archive" size={16} />
                            Stock Cocina
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-grow overflow-hidden relative">
                {view === 'pos' && <BeveragePOS />}
                {view === 'kds-bar' && <BeverageKDS type="beverage" inventoryHook={inventoryHook} />}
                {view === 'kds-kitchen' && <BeverageKDS type="food" inventoryHook={inventoryHook} />}
                {view === 'stock-kitchen' && recipesHook && usersHook ? (
                    <KitchenStockDashboard 
                        inventoryHook={inventoryHook} 
                        recipesHook={recipesHook} 
                        usersHook={usersHook} 
                    />
                ) : (
                    view === 'stock-kitchen' && <div className="p-4 text-center text-gray-500">Cargando módulos...</div>
                )}
            </div>
        </div>
    );
};

export default BeveragesScreen;
