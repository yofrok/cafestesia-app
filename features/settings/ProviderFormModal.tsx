import React, { useState, useEffect, FormEvent } from 'react';
import { Provider } from '../../types';
import Modal from '../../components/Modal';

interface ProviderFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (provider: Omit<Provider, 'id'> | Provider) => void;
    onDelete: (providerId: string) => void;
    provider: Provider | null;
}

const ProviderFormModal: React.FC<ProviderFormModalProps> = ({ isOpen, onClose, onSave, onDelete, provider }) => {
    const [name, setName] = useState('');
    
    useEffect(() => {
        if (isOpen) {
            setName(provider?.name || '');
        }
    }, [isOpen, provider]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const providerData = { name: name.trim() };
        if (provider) {
            onSave({ ...providerData, id: provider.id });
        } else {
            onSave(providerData);
        }
        onClose();
    };

    const handleDelete = () => {
        if (provider && window.confirm(`¿Estás seguro de que quieres eliminar al proveedor "${provider.name}"?`)) {
            onDelete(provider.id);
            onClose();
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={provider ? "Editar Proveedor" : "Añadir Proveedor"}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Nombre del Proveedor</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        required 
                        autoFocus
                        className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                
                <div className="flex justify-between items-center mt-4">
                    <div>
                        {provider && (
                            <button type="button" onClick={handleDelete} className="py-2 px-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">Eliminar</button>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Guardar</button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default ProviderFormModal;