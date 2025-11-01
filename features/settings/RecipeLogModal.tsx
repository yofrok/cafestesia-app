import React from 'react';
import { Recipe, RecipeFeedback } from '../../types';
import Modal from '../../components/Modal';
import Icon from '../../components/Icon';

interface RecipeLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipe: Recipe;
    feedbackLog: RecipeFeedback[];
}

const StarDisplay: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex">
        {[...Array(5)].map((_, i) => (
            <Icon 
                key={i} 
                name="star" 
                size={16} 
                className={i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'} 
            />
        ))}
    </div>
);

const RecipeLogModal: React.FC<RecipeLogModalProps> = ({ isOpen, onClose, recipe, feedbackLog }) => {
    const sortedLog = [...feedbackLog].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Bitácora de: ${recipe.name}`}>
            <div className="max-h-[60vh] overflow-y-auto pr-2">
                {sortedLog.length > 0 ? (
                    <div className="space-y-4">
                        {sortedLog.map(log => (
                            <div key={log.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-semibold text-gray-700">{new Date(log.date).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</span>
                                    <StarDisplay rating={log.rating} />
                                </div>
                                <p className="text-gray-600 whitespace-pre-wrap">{log.notes || "Sin notas."}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-8">No hay feedback registrado para esta receta todavía.</p>
                )}
            </div>
            <div className="flex justify-end mt-6">
                <button onClick={onClose} className="py-2 px-6 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cerrar</button>
            </div>
        </Modal>
    );
};

export default RecipeLogModal;