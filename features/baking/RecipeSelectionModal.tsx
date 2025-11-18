
import React, { useState } from 'react';
import Modal from '../../components/Modal';
import Icon from '../../components/Icon';
import { Recipe } from '../../types';

interface RecipeSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectRecipe: (recipe: Recipe, variantId?: string) => void;
    onSelectHeating: (duration: number, name: string) => void;
    recipes: Recipe[];
}

const RecipeSelectionModal: React.FC<RecipeSelectionModalProps> = ({ isOpen, onClose, onSelectRecipe, onSelectHeating, recipes }) => {
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    
    const handleRecipeSelect = (recipe: Recipe) => {
        if (!recipe.variants || recipe.variants.length === 0) {
            onSelectRecipe(recipe);
            onClose();
        } else {
            setSelectedRecipe(recipe);
        }
    };

    const handleVariantSelect = (variantId: string) => {
        if (selectedRecipe) {
            onSelectRecipe(selectedRecipe, variantId);
        }
        handleBack(); // Reset state
        onClose();
    };

    const handleBack = () => {
        setSelectedRecipe(null);
    };

    const handleHeatingSelect = (duration: number, name: string) => {
        handleBack();
        onSelectHeating(duration, name);
        onClose();
    }

    // Split recipes into categories
    const bakingRecipes = recipes.filter(r => r.name.toLowerCase().includes('(horneado)'));
    const doughRecipes = recipes.filter(r => !r.name.toLowerCase().includes('(horneado)'));

    const modalTitle = selectedRecipe ? `Variantes de: ${selectedRecipe.name}` : "Iniciar un Nuevo Proceso";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
            {selectedRecipe ? (
                // Variant Selection View
                <div className="flex flex-col gap-3">
                     <button
                        onClick={() => handleVariantSelect("base")}
                        className="w-full p-4 bg-blue-100 text-blue-800 rounded-lg border border-blue-200 hover:bg-blue-200 hover:border-blue-300 transition-colors text-left"
                    >
                        <p className="font-bold">{selectedRecipe.baseVariantName || 'Receta Estándar'}</p>
                        {selectedRecipe.baseVariantDescription && (
                            <p className="text-sm text-blue-700 mt-1">{selectedRecipe.baseVariantDescription}</p>
                        )}
                    </button>
                    {selectedRecipe.variants?.map(variant => (
                        <button
                            key={variant.id}
                            onClick={() => handleVariantSelect(variant.id)}
                            className="w-full p-4 bg-gray-100 text-gray-800 rounded-lg border border-gray-200 hover:bg-gray-200 hover:border-gray-300 transition-colors text-left"
                        >
                            <p className="font-bold">{variant.name}</p>
                            {variant.description && (
                                <p className="text-sm text-gray-600 mt-1">{variant.description}</p>
                            )}
                        </button>
                    ))}
                    <button
                        onClick={handleBack}
                        className="mt-4 text-sm text-gray-600 hover:underline font-semibold"
                    >
                        &larr; Volver a recetas
                    </button>
                </div>
            ) : (
                // Main Selection View
                <div className="flex flex-col gap-6 max-h-[70vh] overflow-y-auto pr-2">
                    
                    {/* Section 1: Dough Production */}
                    <div>
                        <h3 className="font-bold text-lg text-blue-700 mb-2 flex items-center gap-2 pb-1 border-b border-blue-100">
                            <span>🥣</span> Elaboración de Masas
                        </h3>
                        <div className="flex flex-col gap-3">
                            {doughRecipes.length > 0 ? doughRecipes.map(recipe => (
                                <button 
                                    key={recipe.id}
                                    onClick={() => handleRecipeSelect(recipe)}
                                    className="w-full p-3 bg-white text-gray-800 font-bold rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors text-left shadow-sm"
                                >
                                    {recipe.name}
                                </button>
                            )) : (
                                <p className="text-sm text-gray-400 italic px-2">No hay recetas de masas configuradas.</p>
                            )}
                        </div>
                    </div>

                    {/* Section 2: Baking */}
                    <div>
                        <h3 className="font-bold text-lg text-orange-700 mb-2 flex items-center gap-2 pb-1 border-b border-orange-100">
                            <span>🔥</span> Horneado Final
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {bakingRecipes.length > 0 ? bakingRecipes.map(recipe => (
                                <button 
                                    key={recipe.id}
                                    onClick={() => handleRecipeSelect(recipe)}
                                    className="w-full p-3 bg-orange-50 text-gray-800 font-bold rounded-lg border border-orange-200 hover:bg-orange-100 hover:border-orange-300 transition-colors text-left shadow-sm"
                                >
                                    {/* Remove the repetitive "(Horneado)" text for display */}
                                    {recipe.name.replace(/\(Horneado\)/i, '').trim()}
                                </button>
                            )) : (
                                <p className="text-sm text-gray-400 italic px-2">No hay recetas de horneado configuradas.</p>
                            )}
                        </div>
                    </div>

                    {/* Section 3: Utilities */}
                    <div>
                        <h3 className="font-bold text-lg text-gray-600 mb-2 flex items-center gap-2 pb-1 border-b border-gray-200">
                            <span>⏱️</span> Herramientas
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                             <button 
                                onClick={() => handleHeatingSelect(15 * 60, "Precalentar (15 min)")}
                                className="w-full p-3 flex flex-col items-center justify-center gap-1 bg-gray-50 text-gray-700 font-bold rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-colors text-sm"
                            >
                                <Icon name="thermometer-snowflake" size={20} /> 
                                <span>Precalentar</span>
                            </button>
                             <button 
                                onClick={() => handleHeatingSelect(7 * 60, "Recalentar (7 min)")}
                                className="w-full p-3 flex flex-col items-center justify-center gap-1 bg-gray-50 text-gray-700 font-bold rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-colors text-sm"
                            >
                               <Icon name="thermometer-sun" size={20} /> 
                               <span>Recalentar</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default RecipeSelectionModal;
