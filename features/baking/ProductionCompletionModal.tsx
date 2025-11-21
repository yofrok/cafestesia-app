
import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { ProductionProcess, User } from '../../types';
import Icon from '../../components/Icon';

interface ProductionCompletionModalProps {
    isOpen: boolean;
    onClose: () => void;
    process: ProductionProcess;
    users: User[];
    onConfirm: (process: ProductionProcess, actualQuantity: number, responsible: string) => void;
}

const ProductionCompletionModal: React.FC<ProductionCompletionModalProps> = ({ isOpen, onClose, process, users, onConfirm }) => {
    const defaultQuantity = process.recipe?.outputQuantity || 1;
    const [quantity, setQuantity] = useState(String(defaultQuantity));
    const [responsible, setResponsible] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setQuantity(String(defaultQuantity));
            setResponsible(users.length > 0 ? users[0].name : '');
            setError('');
        }
    }, [isOpen, defaultQuantity, users]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const qtyNum = parseFloat(quantity);
        
        if (isNaN(qtyNum) || qtyNum < 0) {
            setError("Por favor ingresa una cantidad válida.");
            return;
        }
        if (!responsible) {
            setError("Debes seleccionar quién realizó la producción.");
            return;
        }

        onConfirm(process, qtyNum, responsible);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Finalizar y Firmar Producción">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-bold text-blue-900 text-lg">{process.name}</h4>
                    <p className="text-blue-700 text-sm mt-1">Registra el resultado final para el historial y el inventario.</p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Cantidad Producida Real
                    </label>
                    <div className="flex items-center gap-2">
                        <input 
                            type="number" 
                            value={quantity} 
                            onChange={e => setQuantity(e.target.value)}
                            className="flex-1 p-3 border border-gray-300 rounded-lg text-lg font-bold text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            step="any"
                        />
                        <span className="font-bold text-gray-500 bg-gray-100 px-3 py-3 rounded-lg border border-gray-200">
                            Unidades
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Si hubo merma durante el horneado, ingresa solo lo que salió bien.</p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Responsable (Firma Digital)
                    </label>
                    <div className="relative">
                        <Icon name="check-circle" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <select 
                            value={responsible} 
                            onChange={e => setResponsible(e.target.value)}
                            className="w-full p-3 pl-10 border border-gray-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
                        >
                            {users.map(u => (
                                <option key={u.id} value={u.name}>{u.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm font-medium flex items-center gap-2">
                        <Icon name="alert-triangle" size={16} />
                        {error}
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit"
                        className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-md flex justify-center items-center gap-2"
                    >
                        <Icon name="archive" size={20} />
                        Registrar
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ProductionCompletionModal;
