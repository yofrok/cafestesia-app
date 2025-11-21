
import React, { useState, useEffect, FormEvent } from 'react';
import { Beverage, BeverageCategory, BeverageSize, MenuItemType, MenuStockConfig, RecipeIngredient, InventoryItem } from '../../../types';
import Modal from '../../../components/Modal';
import Icon from '../../../components/Icon';
import RecipeIngredientsEditor from '../recipes/RecipeIngredientsEditor';

interface BeverageFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Beverage, 'id'>) => void;
    onUpdate: (data: Beverage) => void;
    onDelete: (id: string) => void;
    beverage: Beverage | null;
    inventoryItems: InventoryItem[];
}

const BeverageFormModal: React.FC<BeverageFormModalProps> = ({ isOpen, onClose, onSave, onUpdate, onDelete, beverage, inventoryItems }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<MenuItemType>('beverage');
    const [category, setCategory] = useState<BeverageCategory>('caliente');
    const [recipe, setRecipe] = useState('');
    const [modifiersStr, setModifiersStr] = useState('');
    
    // Size management state
    const [hasSizes, setHasSizes] = useState(false);
    const [sizes, setSizes] = useState<BeverageSize[]>([]);
    const [newSizeName, setNewSizeName] = useState('');
    const [newSizeRecipe, setNewSizeRecipe] = useState('');

    // Inventory State
    const [stockMode, setStockMode] = useState<'none' | 'direct' | 'recipe'>('none');
    const [directItemId, setDirectItemId] = useState('');
    const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);

    useEffect(() => {
        if (isOpen) {
            setName(beverage?.name || '');
            setType(beverage?.type || 'beverage');
            setCategory(beverage?.category || 'caliente');
            setRecipe(beverage?.recipe || '');
            setModifiersStr(beverage?.modifiers ? beverage.modifiers.join(', ') : '');
            setHasSizes(beverage?.hasSizes || false);
            setSizes(beverage?.sizes || []);
            
            // Inventory init
            setStockMode(beverage?.stockConfig?.mode || 'none');
            setDirectItemId(beverage?.stockConfig?.directItemId || '');
            setIngredients(beverage?.stockConfig?.ingredients || []);
        }
    }, [isOpen, beverage]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const modifiers = modifiersStr.split(',').map(s => s.trim()).filter(s => s !== '');
        
        const stockConfig: MenuStockConfig = {
            mode: stockMode,
            // Explicitly conditionally add these to avoid undefined, 
            // but we will also sanitize the whole object below.
            directItemId: stockMode === 'direct' ? directItemId : undefined,
            ingredients: stockMode === 'recipe' ? ingredients : undefined
        };

        const data = { name, type, category, recipe, modifiers, hasSizes, sizes, stockConfig };
        
        // CRITICAL: Sanitize data to remove any 'undefined' fields which Firestore rejects.
        const sanitizedData = JSON.parse(JSON.stringify(data));
        
        if (beverage) onUpdate({ ...sanitizedData, id: beverage.id });
        else onSave(sanitizedData);
        
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
        <Modal isOpen={isOpen} onClose={onClose} title={beverage ? "Editar Producto" : "Nuevo Producto"}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto pr-2">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-600 mb-1">Nombre</label>
                        <input 
                            type="text" value={name} onChange={e => setName(e.target.value)} 
                            required className="w-full p-2 border border-gray-300 rounded-md" 
                            placeholder="Ej: Latte, Pizza Pepperoni"
                        />
                    </div>
                    <div className="w-1/3">
                        <label className="block text-sm font-medium text-gray-600 mb-1">Tipo</label>
                        <select value={type} onChange={e => setType(e.target.value as MenuItemType)} className="w-full p-2 border border-gray-300 rounded-md bg-white">
                            <option value="beverage">Bebida</option>
                            <option value="food">Comida</option>
                        </select>
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Categoría (Filtro POS)</label>
                    <select 
                        value={category} 
                        onChange={e => setCategory(e.target.value as BeverageCategory)}
                        className="w-full p-2 border border-gray-300 rounded-md bg-white"
                    >
                        <option value="caliente">Caliente (Café/Té)</option>
                        <option value="frio">Frío / Frappé</option>
                        <option value="metodo">Método (V60, Chemex)</option>
                        <option value="comida">Comida / Alimentos</option>
                        <option value="otro">Otro</option>
                    </select>
                </div>

                {/* --- STOCK CONFIGURATION --- */}
                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-emerald-800 flex items-center gap-2">
                            <Icon name="archive" size={16} />
                            Control de Stock (Automático)
                        </h4>
                    </div>
                    
                    <div className="flex gap-2 mb-3">
                        <button 
                            type="button" onClick={() => setStockMode('none')}
                            className={`flex-1 py-1 px-2 rounded text-xs font-bold border ${stockMode === 'none' ? 'bg-white border-gray-400 text-gray-800 shadow-sm' : 'border-transparent text-gray-500 hover:bg-emerald-100'}`}
                        >
                            Sin Control
                        </button>
                        <button 
                            type="button" onClick={() => setStockMode('direct')}
                            className={`flex-1 py-1 px-2 rounded text-xs font-bold border ${stockMode === 'direct' ? 'bg-white border-emerald-500 text-emerald-800 shadow-sm' : 'border-transparent text-emerald-600 hover:bg-emerald-100'}`}
                        >
                            Producto Final
                        </button>
                        <button 
                            type="button" onClick={() => setStockMode('recipe')}
                            className={`flex-1 py-1 px-2 rounded text-xs font-bold border ${stockMode === 'recipe' ? 'bg-white border-purple-500 text-purple-800 shadow-sm' : 'border-transparent text-purple-600 hover:bg-purple-100'}`}
                        >
                            Receta (Ingr.)
                        </button>
                    </div>

                    {stockMode === 'direct' && (
                        <div>
                            <p className="text-xs text-emerald-700 mb-1">Se descontará 1 unidad de este producto al completar la orden.</p>
                            <select 
                                value={directItemId} 
                                onChange={e => setDirectItemId(e.target.value)}
                                className="w-full p-2 text-sm border border-emerald-300 rounded bg-white"
                            >
                                <option value="">-- Selecciona Producto del Inventario --</option>
                                {inventoryItems.map(item => (
                                    <option key={item.id} value={item.id}>{item.name} (Stock: {item.currentStock})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {stockMode === 'recipe' && (
                        <div className="bg-white p-2 rounded border border-emerald-100">
                            <p className="text-xs text-gray-500 mb-2">Configura los ingredientes que se descontarán por cada unidad vendida.</p>
                            <RecipeIngredientsEditor 
                                ingredients={ingredients} 
                                setIngredients={setIngredients} 
                                inventoryItems={inventoryItems} 
                            />
                        </div>
                    )}
                </div>

                {/* --- RECIPE & SIZES --- */}
                <div className="border-t border-gray-200 py-4 my-2">
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-bold text-gray-700">Instrucciones de Preparación (KDS)</label>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs ${hasSizes ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>Variantes/Tamaños</span>
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
                                Instrucción Única <Icon name="pencil" size={14} />
                            </label>
                            <textarea 
                                value={recipe} onChange={e => setRecipe(e.target.value)} 
                                rows={4}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm" 
                                placeholder={type === 'food' ? "Ej: Calentar 3 min, decorar con..." : "Ej: 18.5g in, 36g out..."}
                            />
                        </div>
                    ) : (
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                             <p className="text-xs text-gray-500 mb-3">Define variantes (Ej: 12oz, Grande) y sus instrucciones.</p>
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
                                    placeholder="Variante (Ej: Grande)" className="p-2 border rounded text-sm"
                                 />
                                 <textarea 
                                    value={newSizeRecipe} onChange={e => setNewSizeRecipe(e.target.value)}
                                    placeholder="Instrucción específica..." rows={2} className="p-2 border rounded text-sm"
                                 />
                                 <button type="button" onClick={handleAddSize} className="bg-blue-500 text-white py-1 px-3 rounded text-sm font-bold self-end">Añadir</button>
                             </div>
                        </div>
                    )}
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Modificadores Comunes</label>
                    <input 
                        type="text" value={modifiersStr} onChange={e => setModifiersStr(e.target.value)} 
                        className="w-full p-2 border border-gray-300 rounded-md" 
                        placeholder="Separados por coma: Leche Soya, Extra Shot, Sin Cebolla"
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
