
import React, { useState, useEffect, FormEvent } from 'react';
import { Recipe, RecipeVariant, RecipeStep } from '../../../types';
import Modal from '../../../components/Modal';
import RecipeStepEditor from './RecipeStepEditor';
import RecipeVariantEditor from './RecipeVariantEditor';

interface RecipeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (recipe: Omit<Recipe, 'id'>) => void;
    onDelete: (recipeId: string) => void;
    recipe: Recipe | null;
}

const RecipeFormModal: React.FC<RecipeFormModalProps> = ({ isOpen, onClose, onSave, onDelete, recipe }) => {
    const [name, setName] = useState('');
    const [pluralName, setPluralName] = useState('');
    const [setupInstruction, setSetupInstruction] = useState('');
    const [baseVariantName, setBaseVariantName] = useState('');
    const [baseVariantDescription, setBaseVariantDescription] = useState('');
    const [steps, setSteps] = useState<RecipeStep[]>([]);
    const [variants, setVariants] = useState<RecipeVariant[]>([]);

    useEffect(() => {
        if (isOpen) {
            setName(recipe?.name || '');
            setPluralName(recipe?.pluralName || '');
            setSetupInstruction(recipe?.setupInstruction || '');
            setBaseVariantName(recipe?.baseVariantName || 'Receta Estándar');
            setBaseVariantDescription(recipe?.baseVariantDescription || '');
            setSteps(recipe?.steps || [{ duration: 300, instruction: 'Nuevo paso', type: 'active' }]);
            setVariants(recipe?.variants || []);
        }
    }, [isOpen, recipe]);

    const handleSave = (e: FormEvent) => {
        e.preventDefault();
        const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);
        
        onSave({
            name,
            pluralName,
            setupInstruction,
            baseVariantName,
            baseVariantDescription,
            steps,
            variants,
            totalDuration,
        });
        onClose();
    };

    const handleDelete = () => {
        if (recipe && window.confirm(`⚠️ ¿Estás seguro de eliminar la receta "${recipe.name}"?\n\nEsta acción no se puede deshacer y perderás el historial asociado.`)) {
            onDelete(recipe.id);
            onClose();
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={recipe ? `Editar Receta: ${recipe.name}` : "Añadir Nueva Receta"}>
            <form onSubmit={handleSave} className="flex flex-col gap-6 max-h-[80vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormGroup label="Nombre de la Receta (Singular)">
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required />
                    </FormGroup>
                    <FormGroup label="Nombre para Notificaciones (Plural)">
                        <input type="text" value={pluralName} onChange={e => setPluralName(e.target.value)} placeholder="Ej: Roles de Canela listos" required />
                    </FormGroup>
                </div>
                <FormGroup label="Instrucción de Configuración Inicial">
                    <textarea value={setupInstruction} onChange={e => setSetupInstruction(e.target.value)} rows={2} />
                </FormGroup>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-md font-bold text-blue-800 mb-2">Configuración de la Receta Base</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormGroup label="Nombre de la Variante Base">
                            <input type="text" value={baseVariantName} onChange={e => setBaseVariantName(e.target.value)} required />
                        </FormGroup>
                        <FormGroup label="Descripción de la Variante Base">
                            <input type="text" value={baseVariantDescription} onChange={e => setBaseVariantDescription(e.target.value)} placeholder="Ej: 2 charolas (12 pzas)" />
                        </FormGroup>
                    </div>
                </div>

                <RecipeStepEditor steps={steps} setSteps={setSteps} />
                
                <RecipeVariantEditor
                    variants={variants}
                    setVariants={setVariants}
                    baseSteps={steps}
                />

                <div className="flex justify-between items-center mt-4 pt-4 border-t sticky bottom-0 bg-white">
                    <div>
                        {recipe && (
                            <button type="button" onClick={handleDelete} className="py-2 px-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">
                                Eliminar
                            </button>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">
                            Cancelar
                        </button>
                        <button type="submit" className="py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                            Guardar Receta
                        </button>
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

export default RecipeFormModal;
