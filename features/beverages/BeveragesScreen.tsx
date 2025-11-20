
import React, { useState } from 'react';
import BeveragePOS from './BeveragePOS';
import BeverageKDS from './BeverageKDS';
import Icon from '../../components/Icon';

const BeveragesScreen: React.FC = () => {
    const [view, setView] = useState<'pos' | 'kds'>('pos');

    return (
        <div className="flex flex-col h-full">
            {/* Header Navigation */}
            <header className="flex-shrink-0 bg-white border-b border-gray-200 p-2 flex justify-center gap-4">
                <button 
                    onClick={() => setView('pos')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${view === 'pos' ? 'bg-amber-700 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    <Icon name="plus-circle" size={20} />
                    Comanda (POS)
                </button>
                <button 
                    onClick={() => setView('kds')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${view === 'kds' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    <Icon name="list" size={20} />
                    Barra (KDS)
                </button>
            </header>

            <div className="flex-grow overflow-hidden relative">
                {view === 'pos' ? <BeveragePOS /> : <BeverageKDS />}
            </div>
        </div>
    );
};

export default BeveragesScreen;
