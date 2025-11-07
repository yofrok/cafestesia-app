import React, { useState } from 'react';
import { RecipeVariant, RecipeStep } from '../../../types';
import Icon from '../../../components/Icon';

interface RecipeVariantEditorProps {
    variants: RecipeVariant[];
    setVariants: React.Dispatch<React.SetStateAction<RecipeVariant[]>>;
    baseSteps: RecipeStep[];
}

const RecipeVariantEditor: React.FC<RecipeVariantEditorProps> = ({ variants, setVariants, baseSteps }) => {
    const [newVariantName, setNewVariantName] = useState('');
    const [newVariantDescription, setNewVariantDescription] = useState('');
    const [editingVariant, setEditingVariant] = useState<RecipeVariant | null>(null);

    const addVariant = () => {
        if (!newVariantName.trim()) return;
        const newVariant: RecipeVariant = {
            id: `var-${Date.now()}`,
            name: newVariantName.trim(),
            description: newVariantDescription.trim(),
            stepOverrides: Array(baseSteps.length).fill(null),
        };
        setVariants([...variants, newVariant]);
        setNewVariantName('');
        setNewVariantDescription('');
    };
    
    const removeVariant = (id: string) => {
        setVariants(variants.filter(v => v.id !== id));
        if (editingVariant?.id === id) {
            setEditingVariant(null);
        }
    };

    const handleVariantChange = (variantId: string, field: 'name' | 'description', value: string) => {
        setVariants(prevVariants =>
            prevVariants.map(v =>
                v.id === variantId ? { ...v, [field]: value } : v
            )
        );
    };
    
    const updateVariantStep = (variantId: string, stepIndex: number, instruction: string) => {
        setVariants(prevVariants =>
            prevVariants.map(v => {
                if (v.id === variantId) {
                    const newOverrides = [...v.stepOverrides];
                    // If instruction is same as base, store null to signify no override
                    const newInstruction = instruction.trim() === baseSteps[stepIndex].instruction.trim() ? null : instruction.trim();

                    if(newInstruction === null) {
                        newOverrides[stepIndex] = null;
                    } else {
                        newOverrides[stepIndex] = {
                            ...(newOverrides[stepIndex] || {}),
                            instruction: newInstruction,
                        };
                    }
                    
                    // Clean up object if no overrides exist for this step
                    if (newOverrides[stepIndex] && Object.keys(newOverrides[stepIndex]!).length === 0) {
                        newOverrides[stepIndex] = null;
                    }

                    return { ...v, stepOverrides: newOverrides };
                }
                return v;
            })
        );
    };


    return (
        <div>
            <h3 className="text-lg font-bold text-blue-700 mb-2">Variantes de Receta (Opcional)</h3>
            <div className="space-y-3 bg-gray-100 p-3 rounded-lg border">
                {variants.map(variant => {
                    const isEditingThisVariant = editingVariant?.id === variant.id;
                    return (
                        <div key={variant.id} className="bg-white p-3 rounded-md shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                {isEditingThisVariant ? (
                                    <input
                                        type="text"
                                        value={variant.name}
                                        onChange={(e) => handleVariantChange(variant.id, 'name', e.target.value)}
                                        className="font-semibold text-gray-800 p-1 border border-gray-300 rounded-md w-full mr-2"
                                    />
                                ) : (
                                    <h4 className="font-semibold text-gray-800">{variant.name}</h4>
                                )}
                                <div>
                                    <button
                                        type="button" onClick={() => setEditingVariant(isEditingThisVariant ? null : variant)}
                                        className={`p-2 rounded-full transition-colors ${isEditingThisVariant ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                                    >
                                        <Icon name="pencil" size={16} />
                                    </button>
                                    <button type="button" onClick={() => removeVariant(variant.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full">
                                        <Icon name="trash-2" size={16} />
                                    </button>
                                </div>
                            </div>
                            {isEditingThisVariant && (
                                <div className="space-y-2 mt-2 pt-2 border-t">
                                    <div className="text-sm">
                                        <label className="text-xs text-gray-500">Descripción de la Variante</label>
                                        <input
                                            type="text"
                                            value={variant.description || ''}
                                            onChange={(e) => handleVariantChange(variant.id, 'description', e.target.value)}
                                            placeholder="Ej: 1 charola (6-8 pzas)"
                                            className="w-full p-1 border border-gray-300 rounded-md"
                                        />
                                    </div>
                                    {baseSteps.map((baseStep, index) => {
                                        const override = variant.stepOverrides[index];
                                        return (
                                            <div key={index} className="flex items-start gap-2 text-sm">
                                                <span className="font-bold text-gray-500 mt-2">{index + 1}.</span>
                                                <div className="flex-grow">
                                                    <label className="text-xs text-gray-500">Instrucción (Base: "{baseStep.instruction}")</label>
                                                    <textarea
                                                        value={override?.instruction || baseStep.instruction}
                                                        onChange={(e) => updateVariantStep(variant.id, index, e.target.value)}
                                                        rows={2}
                                                        className="w-full p-1 border border-gray-300 rounded-md"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
                <div className="flex flex-col md:flex-row gap-2 pt-2">
                    <input
                        type="text" value={newVariantName} onChange={e => setNewVariantName(e.target.value)}
                        placeholder="Nombre de variante (ej: Media Charola)"
                        className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm"
                    />
                    <input
                        type="text" value={newVariantDescription} onChange={e => setNewVariantDescription(e.target.value)}
                        placeholder="Descripción (ej: 1 charola)"
                        className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm"
                    />
                    <button type="button" onClick={addVariant} className="flex-shrink-0 py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 text-sm">Añadir</button>
                </div>
            </div>
        </div>
    );
};

export default RecipeVariantEditor;