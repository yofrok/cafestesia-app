
import React, { useState, useEffect } from 'react';
import { RecipeIngredient, InventoryItem } from '../../../types';
import Icon from '../../../components/Icon';

interface RecipeIngredientsEditorProps {
    ingredients: RecipeIngredient[];
    setIngredients: (ingredients: RecipeIngredient[]) => void;
    inventoryItems: InventoryItem[];
}

// Helper component to handle decimal inputs correctly without cursor jumping
const IngredientRow: React.FC<{
    ingredient: RecipeIngredient;
    index: number;
    inventoryItems: InventoryItem[];
    onUpdate: (index: number, field: keyof RecipeIngredient, value: any) => void;
    onRemove: (index: number) => void;
}> = ({ ingredient, index, inventoryItems, onUpdate, onRemove }) => {
    // Local state to handle the input string (allows "0." without parsing to 0 immediately)
    const [localQuantity, setLocalQuantity] = useState(String(ingredient.quantity || ''));
    const selectedItem = inventoryItems.find(i => i.id === ingredient.inventoryItemId);

    // Sync from prop if prop changes externally (and isn't just a parse of our current string)
    useEffect(() => {
        const numVal = parseFloat(localQuantity);
        if (numVal !== ingredient.quantity && !(Number.isNaN(numVal) && !ingredient.quantity)) {
             setLocalQuantity(String(ingredient.quantity || ''));
        }
    }, [ingredient.quantity]);

    const handleQuantityChange = (val: string) => {
        setLocalQuantity(val);
        const parsed = parseFloat(val);
        if (!isNaN(parsed)) {
            onUpdate(index, 'quantity', parsed);
        } else {
            // If empty or invalid, we set it to 0 in the parent state for consistency,
            // but keep the local string as is so the user can type "0." or delete content.
            onUpdate(index, 'quantity', 0);
        }
    };

    return (
        <div className="flex gap-2 items-center bg-white p-2 rounded border border-emerald-100">
            <div className="flex-grow">
                <select 
                    value={ingredient.inventoryItemId}
                    onChange={(e) => onUpdate(index, 'inventoryItemId', e.target.value)}
                    className="w-full p-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                    {inventoryItems.map(item => (
                        <option key={item.id} value={item.id}>
                            {item.name} ({item.unit})
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex items-center gap-1 w-28 relative">
                <input 
                    type="number"
                    value={localQuantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    className="w-full p-1 pr-8 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="0"
                    step="any"
                />
                <span className="absolute right-2 text-xs text-gray-500 pointer-events-none font-bold bg-white/80 px-1">
                    {selectedItem?.unit}
                </span>
            </div>
            <button 
                type="button" 
                onClick={() => onRemove(index)}
                className="text-red-400 hover:text-red-600 p-1 transition-colors"
                title="Eliminar ingrediente"
            >
                <Icon name="trash-2" size={16} />
            </button>
        </div>
    );
};

const RecipeIngredientsEditor: React.FC<RecipeIngredientsEditorProps> = ({ ingredients, setIngredients, inventoryItems }) => {

    const addIngredient = () => {
        if (inventoryItems.length === 0) return;
        setIngredients([...ingredients, { inventoryItemId: inventoryItems[0].id, quantity: 0 }]);
    };

    const removeIngredient = (index: number) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };

    const updateIngredient = (index: number, field: keyof RecipeIngredient, value: any) => {
        const updated = [...ingredients];
        // @ts-ignore
        updated[index][field] = value;
        setIngredients(updated);
    };

    return (
        <div className="mt-4 border-t pt-4">
            <h3 className="text-lg font-bold text-emerald-700 mb-2 flex items-center gap-2">
                <Icon name="archive" size={20}/>
                Consumo de Inventario
            </h3>
            <p className="text-sm text-gray-500 mb-3">
                Define qué ingredientes se descuentan al preparar un lote estándar de esta receta.
            </p>
            
            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 space-y-3">
                {ingredients.length > 0 ? ingredients.map((ing, index) => (
                    <IngredientRow
                        key={`${index}-${ing.inventoryItemId}`}
                        index={index}
                        ingredient={ing}
                        inventoryItems={inventoryItems}
                        onUpdate={updateIngredient}
                        onRemove={removeIngredient}
                    />
                )) : (
                    <p className="text-sm text-gray-400 text-center italic py-2">No hay ingredientes configurados.</p>
                )}
                
                <button 
                    type="button"
                    onClick={addIngredient}
                    className="w-full py-2 bg-white border border-emerald-300 text-emerald-700 font-semibold rounded hover:bg-emerald-100 transition-colors text-sm flex items-center justify-center gap-2 shadow-sm"
                >
                    <Icon name="plus" size={14} />
                    Añadir Ingrediente
                </button>
            </div>
        </div>
    );
};

export default RecipeIngredientsEditor;
