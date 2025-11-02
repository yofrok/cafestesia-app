import React, { useState, useEffect, FormEvent } from 'react';
import { User } from '../../types';
import Modal from '../../components/Modal';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: Omit<User, 'id'> | User) => void;
    onDelete: (userId: string) => void;
    user: User | null;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSave, onDelete, user }) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState('#CCCCCC');
    
    useEffect(() => {
        if (isOpen) {
            setName(user?.name || '');
            setColor(user?.color || '#CCCCCC');
        }
    }, [isOpen, user]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const userData = { name: name.trim(), color };
        if (user) {
            onSave({ ...userData, id: user.id });
        } else {
            onSave(userData);
        }
        onClose();
    };

    const handleDelete = () => {
        if (user && window.confirm(`¿Estás seguro de que quieres eliminar a "${user.name}"? Esto no se puede deshacer.`)) {
            onDelete(user.id);
            onClose();
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={user ? "Editar Usuario" : "Añadir Usuario"}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Nombre del Usuario</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        required 
                        autoFocus
                        className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Color de Etiqueta</label>
                    <div className="flex items-center gap-3">
                         <input 
                            type="color" 
                            value={color} 
                            onChange={e => setColor(e.target.value)} 
                            className="w-12 h-10 p-1 border border-gray-300 rounded-md cursor-pointer"
                        />
                        <input 
                            type="text" 
                            value={color}
                            onChange={e => setColor(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                    <div>
                        {user && (
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

export default UserFormModal;