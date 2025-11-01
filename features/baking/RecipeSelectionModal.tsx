import React from 'react';
import Modal from '../../components/Modal';
import { RECIPES } from '../../constants';
import Icon from '../../components/Icon';

interface RecipeSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectRecipe: (recipeId: string) => void;
    onSelectHeating: (duration: number, name: string) => void;
}

const RecipeSelectionModal: React.FC<RecipeSelectionModalProps> = ({ isOpen, onClose, onSelectRecipe, onSelectHeating }) => {
    
    const handleRecipeSelect = (recipeId: string) => {
        onSelectRecipe(recipeId);
        onClose();
    };

    const handleHeatingSelect = (duration: number, name: string) => {
        onSelectHeating(duration, name);
        onClose();
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Iniciar un Nuevo Proceso">
            <div className="flex flex-col gap-6">
                <div>
                    <h3 className="font-bold text-lg text-blue-700 mb-2">Recetas de Horneado</h3>
                    <div className="flex flex-col gap-3">
                        {Object.values(RECIPES).map(recipe => (
                            <button 
                                key={recipe.id}
                                onClick={() => handleRecipeSelect(recipe.id)}
                                className="w-full p-4 bg-gray-100 text-gray-800 font-bold rounded-lg border border-gray-200 hover:bg-gray-200 hover:border-gray-300 transition-colors text-left"
                            >
                                Hornear {recipe.name}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="font-bold text-lg text-blue-700 mb-2">Procesos de Calentamiento</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         <button 
                            onClick={() => handleHeatingSelect(15 * 60, "Precalentar (15 min)")}
                            className="w-full p-4 flex items-center justify-center gap-2 bg-gray-100 text-gray-800 font-bold rounded-lg border border-gray-200 hover:bg-gray-200 hover:border-gray-300 transition-colors"
                        >
                            <Icon name="thermometer-snowflake" size={20} /> Precalentar
                        </button>
                         <button 
                            onClick={() => handleHeatingSelect(7 * 60, "Recalentar (7 min)")}
                            className="w-full p-4 flex items-center justify-center gap-2 bg-gray-100 text-gray-800 font-bold rounded-lg border border-gray-200 hover:bg-gray-200 hover:border-gray-300 transition-colors"
                        >
                           <Icon name="thermometer-sun" size={20} /> Recalentar
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default RecipeSelectionModal;