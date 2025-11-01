import React, { useState, useEffect, FormEvent } from 'react';
import { Category } from '../../types';
import Modal from '../../components/Modal';

interface CategoryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (category: Omit<Category, 'id'> | Category) => void;
    onDelete: (categoryId: string) => void;
    category: Category | null;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({ isOpen, onClose, onSave, onDelete, category }) => {
    const [name, setName] = useState('');
    
    useEffect(() => {
        if (isOpen) {
            setName(category?.name || '');
        }
    }, [isOpen, category]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const categoryData = { name: name.trim() };
        if (category) {
            onSave({ ...categoryData, id: category.id });
        } else {
            onSave(categoryData);
        }
        onClose();
    };

    const handleDelete = () => {
        if (category && window.confirm(`¿Estás seguro de que quieres eliminar la categoría "${category.name}"?`)) {
            onDelete(category.id);
            onClose();
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={category ? "Editar Categoría" : "Añadir Categoría"}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Nombre de la Categoría</label>
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
                        {category && (
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

export default CategoryFormModal;