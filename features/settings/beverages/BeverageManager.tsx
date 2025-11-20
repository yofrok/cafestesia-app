
import React, { useState } from 'react';
import { useBeverages } from '../../../services/useBeverages';
import { Beverage } from '../../../types';
import Icon from '../../../components/Icon';
import BeverageFormModal from './BeverageFormModal';

const BeverageManager: React.FC = () => {
    const { beverages, addBeverage, updateBeverage, deleteBeverage } = useBeverages();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBeverage, setEditingBeverage] = useState<Beverage | null>(null);

    const handleEdit = (b: Beverage) => {
        setEditingBeverage(b);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingBeverage(null);
        setIsModalOpen(true);
    };

    // Group by category
    const grouped = beverages.reduce((acc, b) => {
        (acc[b.category] = acc[b.category] || []).push(b);
        return acc;
    }, {} as Record<string, Beverage[]>);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Menú de Bebidas</h2>
                    <p className="text-sm text-gray-500">Gestiona las recetas rápidas para el KDS.</p>
                </div>
                <button onClick={handleAdd} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                    <Icon name="plus-circle" size={16} />
                    Nueva Bebida
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.keys(grouped).map(cat => (
                    <div key={cat} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-lg capitalize mb-3 text-blue-700 border-b pb-2">{cat}</h3>
                        <ul className="space-y-2">
                            {grouped[cat].map(bev => (
                                <li key={bev.id} onClick={() => handleEdit(bev)} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded cursor-pointer group">
                                    <span className="font-medium text-gray-700">{bev.name}</span>
                                    <Icon name="pencil" size={14} className="text-gray-300 group-hover:text-blue-500" />
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <BeverageFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={addBeverage}
                onUpdate={updateBeverage}
                onDelete={deleteBeverage}
                beverage={editingBeverage}
            />
        </div>
    );
};

export default BeverageManager;
