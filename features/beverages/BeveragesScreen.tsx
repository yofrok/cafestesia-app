
import React, { useState } from 'react';
import BeveragePOS from './BeveragePOS';
import BeverageKDS from './BeverageKDS';
import Icon from '../../components/Icon';
import { useInventory } from '../../services/useInventory';

interface BeveragesScreenProps {
    inventoryHook: ReturnType<typeof useInventory>;
}

const BeveragesScreen: React.FC<BeveragesScreenProps> = ({ inventoryHook }) => {
    const [view, setView] = useState<'pos' | 'kds-bar' | 'kds-kitchen'>('pos');

    return (
        <div className="flex flex-col h-full">
            {/* Header Navigation */}
            <header className="flex-shrink-0 bg-white border-b border-gray-200 p-2 overflow-x-auto">
                <div className="flex justify-center gap-2 min-w-max">
                    <button 
                        onClick={() => setView('pos')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${view === 'pos' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <Icon name="plus-circle" size={18} />
                        Comanda (POS)
                    </button>
                    <div className="w-px bg-gray-300 mx-2 h-8 self-center"></div>
                    <button 
                        onClick={() => setView('kds-bar')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${view === 'kds-bar' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <Icon name="star" size={18} />
                        Barra (KDS)
                    </button>
                    <button 
                        onClick={() => setView('kds-kitchen')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${view === 'kds-kitchen' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <Icon name="cake-slice" size={18} />
                        Cocina (KDS)
                    </button>
                </div>
            </header>

            <div className="flex-grow overflow-hidden relative">
                {view === 'pos' && <BeveragePOS />}
                {view === 'kds-bar' && <BeverageKDS type="beverage" inventoryHook={inventoryHook} />}
                {view === 'kds-kitchen' && <BeverageKDS type="food" inventoryHook={inventoryHook} />}
            </div>
        </div>
    );
};

export default BeveragesScreen;
