
import React, { useState, useEffect, FormEvent } from 'react';
import { Beverage, BeverageCategory, BeverageSize } from '../../../types';
import Modal from '../../../components/Modal';
import Icon from '../../../components/Icon';

interface BeverageFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Beverage, 'id'>) => void;
    onUpdate: (data: Beverage) => void;
    onDelete: (id: string) => void;
    beverage: Beverage | null;
}

const BeverageFormModal: React.FC<BeverageFormModalProps> = ({ isOpen, onClose, onSave, onUpdate, onDelete, beverage }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState<BeverageCategory>('caliente');
    const [recipe, setRecipe] = useState('');
    const [modifiersStr, setModifiersStr] = useState('');
    
    // Size management state
    const [hasSizes, setHasSizes] = useState(false);
    const [sizes, setSizes] = useState<BeverageSize[]>([]);
    const [newSizeName, setNewSizeName] = useState('');
    const [newSizeRecipe, setNewSizeRecipe] = useState('');

    useEffect(() => {
        if (isOpen) {
            setName(beverage?.name || '');
            setCategory(beverage?.category || 'caliente');
            setRecipe(beverage?.recipe || '');
            setModifiersStr(beverage?.modifiers ? beverage.modifiers.join(', ') : '');
            setHasSizes(beverage?.hasSizes || false);
            setSizes(beverage?.sizes || []);
        }
    }, [isOpen, beverage]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const modifiers = modifiersStr.split(',').map(s => s.trim()).filter(s => s !== '');
        
        const data = { name, category, recipe, modifiers, hasSizes, sizes };
        
        if (beverage) onUpdate({ ...data, id: beverage.id });
        else onSave(data);
        
        onClose();
    };

    const handleAddSize = () => {
        if (!newSizeName.trim()) return;
        setSizes([...sizes, { name: newSizeName.trim(), recipe: newSizeRecipe.trim() }]);
        setNewSizeName('');
        setNewSizeRecipe('');
    };

    const removeSize = (index: number) => {
        setSizes(sizes.filter((_, i) => i !== index));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={beverage ? "Editar Bebida" : "Nueva Bebida"}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto pr-2">
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Nombre</label>
                    <input 
                        type="text" value={name} onChange={e => setName(e.target.value)} 
                        required className="w-full p-2 border border-gray-300 rounded-md" 
                        placeholder="Ej: Latte, V60 Etiopía"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Categoría</label>
                    <select 
                        value={category} 
                        onChange={e => setCategory(e.target.value as BeverageCategory)}
                        className="w-full p-2 border border-gray-300 rounded-md bg-white"
                    >
                        <option value="caliente">Caliente (Máquina)</option>
                        <option value="frio">Frío / Frappé</option>
                        <option value="metodo">Método (V60, Chemex)</option>
                        <option value="otro">Otro</option>
                    </select>
                </div>

                <div className="border-t border-b border-gray-200 py-4 my-2">
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-bold text-gray-700">Configuración de Receta</label>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs ${hasSizes ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>Múltiples Tamaños</span>
                            <button 
                                type="button"
                                onClick={() => setHasSizes(!hasSizes)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hasSizes ? 'bg-blue-600' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hasSizes ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>

                    {!hasSizes ? (
                         <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
                                Receta Única <Icon name="pencil" size={14} />
                            </label>
                            <textarea 
                                value={recipe} onChange={e => setRecipe(e.target.value)} 
                                rows={4}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm" 
                                placeholder="Ej: 18.5g in, 36g out. Leche texturizada fina..."
                            />
                        </div>
                    ) : (
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                             <p className="text-xs text-gray-500 mb-3">Define las variantes (Ej: 12oz, 16oz) y su receta específica.</p>
                             <ul className="space-y-2 mb-3">
                                 {sizes.map((size, idx) => (
                                     <li key={idx} className="bg-white p-2 rounded border border-gray-200 text-sm">
                                         <div className="flex justify-between items-start">
                                             <span className="font-bold text-blue-700">{size.name}</span>
                                             <button type="button" onClick={() => removeSize(idx)} className="text-red-400 hover:text-red-600"><Icon name="x" size={14}/></button>
                                         </div>
                                         <p className="text-gray-600 mt-1 text-xs">{size.recipe}</p>
                                     </li>
                                 ))}
                             </ul>
                             <div className="flex flex-col gap-2">
                                 <input 
                                    type="text" value={newSizeName} onChange={e => setNewSizeName(e.target.value)} 
                                    placeholder="Nombre Tamaño (Ej: 16oz)" className="p-2 border rounded text-sm"
                                 />
                                 <textarea 
                                    value={newSizeRecipe} onChange={e => setNewSizeRecipe(e.target.value)}
                                    placeholder="Receta para este tamaño..." rows={2} className="p-2 border rounded text-sm"
                                 />
                                 <button type="button" onClick={handleAddSize} className="bg-blue-500 text-white py-1 px-3 rounded text-sm font-bold self-end">Añadir Tamaño</button>
                             </div>
                        </div>
                    )}
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Modificadores Comunes</label>
                    <input 
                        type="text" value={modifiersStr} onChange={e => setModifiersStr(e.target.value)} 
                        className="w-full p-2 border border-gray-300 rounded-md" 
                        placeholder="Separados por coma: Leche Soya, Deslactosada, Extra Shot"
                    />
                </div>

                <div className="flex justify-between pt-4 border-t mt-2">
                    {beverage && (
                        <button type="button" onClick={() => { if(window.confirm('¿Eliminar?')) onDelete(beverage.id); onClose(); }} className="text-red-500 font-bold text-sm">
                            Eliminar
                        </button>
                    )}
                    <div className="flex gap-2 ml-auto">
                         <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg">Cancelar</button>
                         <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-lg font-bold">Guardar</button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default BeverageFormModal;
