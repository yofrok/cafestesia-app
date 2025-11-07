import React from 'react';
import { RecipeStep } from '../../../types';
import Icon from '../../../components/Icon';

interface RecipeStepEditorProps {
    steps: RecipeStep[];
    setSteps: React.Dispatch<React.SetStateAction<RecipeStep[]>>;
}

const RecipeStepEditor: React.FC<RecipeStepEditorProps> = ({ steps, setSteps }) => {

    const handleStepChange = (index: number, field: keyof RecipeStep, value: string) => {
        const newSteps = [...steps];
        if (field === 'duration') {
            newSteps[index][field] = parseInt(value, 10) * 60; // Convert minutes to seconds
        } else {
            newSteps[index][field] = value;
        }
        setSteps(newSteps);
    };

    const addStep = () => {
        setSteps([...steps, { duration: 300, instruction: 'Nuevo paso' }]);
    };

    const removeStep = (index: number) => {
        if (steps.length <= 1) return;
        setSteps(steps.filter((_, i) => i !== index));
    };

    return (
        <div>
            <h3 className="text-lg font-bold text-blue-700 mb-2">Pasos del Horneado</h3>
            <div className="space-y-3 bg-gray-100 p-3 rounded-lg border">
                {steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-2 bg-white p-2 rounded-md shadow-sm">
                        <span className="font-bold text-gray-500 mt-2">{index + 1}.</span>
                        <div className="flex-grow grid grid-cols-1 md:grid-cols-[1fr_120px] gap-2">
                             <textarea
                                value={step.instruction}
                                onChange={e => handleStepChange(index, 'instruction', e.target.value)}
                                rows={2}
                                placeholder="Instrucción del paso"
                                className="w-full p-2 text-sm border border-gray-300 rounded-md"
                            />
                            <div className="flex items-center">
                                <input
                                    type="number"
                                    value={step.duration / 60} // Display minutes
                                    onChange={e => handleStepChange(index, 'duration', e.target.value)}
                                    min="1"
                                    className="w-full p-2 text-sm border border-gray-300 rounded-md"
                                />
                                <span className="ml-2 text-sm text-gray-600">min</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => removeStep(index)}
                            disabled={steps.length <= 1}
                            className="p-2 text-red-500 hover:bg-red-100 rounded-full disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                            <Icon name="trash-2" size={18} />
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={addStep}
                    className="w-full mt-2 py-2 px-4 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 transition-colors text-sm flex items-center justify-center gap-2"
                >
                    <Icon name="plus" size={16} />
                    Añadir Paso
                </button>
            </div>
        </div>
    );
};

export default RecipeStepEditor;