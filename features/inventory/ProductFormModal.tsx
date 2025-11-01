import React, { useState, useEffect, FormEvent } from 'react';
import { InventoryItem, Provider, Category } from '../../types';
import Modal from '../../components/Modal';
import { INVENTORY_UNITS } from '../../constants';

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: Omit<InventoryItem, 'id' | 'purchaseHistory'> | InventoryItem) => void;
    onDelete: (itemId: string) => void;
    item: InventoryItem | null;
    providers: Provider[];
    categories: Category[];
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, onSave, onDelete, item, providers, categories }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [provider, setProvider] = useState('');
    const [stock, setStock] = useState('0');
    const [unit, setUnit] = useState(INVENTORY_UNITS[0]);
    const [minStock, setMinStock] = useState('0');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setName(item?.name || '');
            setCategory(item?.category || (categories.length > 0 ? categories[0].name : ''));
            setProvider(item?.providerPreferido || '');
            setStock(String(item?.currentStock || 0));
            setUnit(item?.unit || INVENTORY_UNITS[0]);
            setMinStock(String(item?.minStock || 0));
            setError('');
        }
    }, [isOpen, item, categories]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setError('');
        
        const stockNum = parseFloat(stock);
        const minStockNum = parseFloat(minStock);

        if (!name.trim()) { setError('El nombre es obligatorio.'); return; }
        if (!unit.trim()) { setError('La unidad es obligatoria.'); return; }
        if (isNaN(stockNum) || stockNum < 0) { setError('Stock debe ser un número positivo.'); return; }
        if (isNaN(minStockNum) || minStockNum < 0) { setError('Nivel mínimo debe ser un número positivo.'); return; }

        if (item) {
            const updatedItem: InventoryItem = {
                ...item,
                name: name.trim(),
                category: category.trim() || 'Sin Categoría',
                providerPreferido: provider.trim(),
                currentStock: stockNum,
                unit: unit.trim(),
                minStock: minStockNum,
            };
            onSave(updatedItem);
        } else {
            const newItemData: Omit<InventoryItem, 'id' | 'purchaseHistory'> = {
                name: name.trim(),
                category: category.trim() || 'Sin Categoría',
                providerPreferido: provider.trim(),
                currentStock: stockNum,
                unit: unit.trim(),
                minStock: minStockNum,
            };
            onSave(newItemData);
        }
        onClose();
    };

    const handleDelete = () => {
        if (item && window.confirm(`¿Estás seguro de que quieres eliminar "${item.name}"?`)) {
            onDelete(item.id);
            onClose();
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={item ? "Editar Producto" : "Añadir Producto"}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <FormGroup label="Nombre del Producto">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required />
                </FormGroup>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormGroup label="Categoría">
                        <select value={category} onChange={e => setCategory(e.target.value)}>
                             <option value="">Sin Categoría</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                     </FormGroup>
                     <FormGroup label="Proveedor Preferido">
                        <select value={provider} onChange={e => setProvider(e.target.value)}>
                            <option value="">Sin Proveedor</option>
                            {providers.map(p => (
                                <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                        </select>
                     </FormGroup>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormGroup label="Stock Actual"><input type="number" value={stock} onChange={e => setStock(e.target.value)} step="any" min="0" required /></FormGroup>
                    <FormGroup label="Unidad">
                        <select value={unit} onChange={e => setUnit(e.target.value)} required>
                            {INVENTORY_UNITS.map(u => (
                                <option key={u} value={u}>{u}</option>
                            ))}
                        </select>
                    </FormGroup>
                </div>
                <FormGroup label="Nivel Mínimo (para Alertas)">
                    <input type="number" value={minStock} onChange={e => setMinStock(e.target.value)} step="any" min="0" required />
                </FormGroup>

                {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                
                <div className="flex justify-between items-center mt-4">
                    <div>
                        {item && (
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

const FormGroup: React.FC<{label: string, children: React.ReactElement<{ className?: string }>}> = ({label, children}) => (
    <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
        {React.cloneElement(children, { className: "w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" })}
    </div>
);


export default ProductFormModal;