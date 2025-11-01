import React, { useState } from 'react';
import { ProductionProcess, RecipeStep } from '../../types';
import Icon from '../../components/Icon';

interface ProcessCardProps {
    process: ProductionProcess;
    onAdvance: (processId: string) => void;
    onTogglePause: (processId: string) => void;
    onCancel: (processId: string) => void;
    onAcknowledgeFinish: (process: ProductionProcess) => void;
    isAudioReady: boolean; // New prop
}

const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) seconds = 0;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const StepItem: React.FC<{ step: RecipeStep, isCompleted: boolean, isCurrent: boolean }> = ({ step, isCompleted, isCurrent }) => {
    let stateStyles = 'text-gray-500';
    if (isCurrent) stateStyles = 'font-bold text-blue-700';
    if (isCompleted) stateStyles = 'text-gray-400 line-through';

    return (
        <div className="flex items-start gap-3 py-2">
            <div className="flex-shrink-0 mt-1">
                {isCompleted ? <Icon name="check-circle" size={16} className="text-green-500" /> : <div className={`w-4 h-4 rounded-full border-2 ${isCurrent ? 'border-blue-500 bg-blue-100' : 'border-gray-300'}`}></div>}
            </div>
            <p className={`text-sm ${stateStyles}`}>{step.instruction}</p>
        </div>
    );
};


const ProcessCard: React.FC<ProcessCardProps> = ({ process, onAdvance, onTogglePause, onCancel, onAcknowledgeFinish, isAudioReady }) => {
    const { state, name, steps, currentStepIndex, totalTimeLeft, stepTimeLeft } = process;
    const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);

    const getBorderColor = () => {
        switch (state) {
            case 'running': return 'border-green-500';
            case 'alarm': return 'border-red-500 animate-pulse-red';
            case 'finished': return 'border-blue-500';
            case 'paused': return 'border-gray-300';
            default: return 'border-gray-300';
        }
    };

    const getHeaderColor = () => {
         switch (state) {
            case 'running': return 'bg-green-100 text-green-800';
            case 'alarm': return 'bg-red-100 text-red-800';
            case 'finished': return 'bg-blue-100 text-blue-800';
            case 'paused': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100';
        }
    }
    
    const renderAction = () => {
        switch (state) {
            case 'paused':
                return (
                    <button 
                        onClick={() => onTogglePause(process.id)} 
                        disabled={!isAudioReady}
                        className="w-full bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isAudioReady ? 'INICIAR' : 'Cargando audio...'}
                    </button>
                );
            case 'running':
                return <button onClick={() => onTogglePause(process.id)} className="w-full bg-yellow-500 text-white font-bold py-3 rounded-lg hover:bg-yellow-600 transition-colors">PAUSAR</button>;
            case 'alarm':
                 return <button onClick={() => onAdvance(process.id)} className="w-full bg-blue-500 text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition-colors animate-pulse">SIGUIENTE PASO</button>;
            case 'finished':
                 return <button onClick={() => onAcknowledgeFinish(process)} className="w-full bg-gray-500 text-white font-bold py-3 rounded-lg hover:bg-gray-600 transition-colors">LIMPIAR</button>;
        }
    };
    
    if (isConfirmingCancel) {
        return (
            <div className={`flex flex-col bg-white rounded-lg border-2 border-red-400 shadow-lg p-4 justify-center items-center text-center`}>
                <h4 className="font-bold text-lg mb-2 text-gray-800">¿Estás seguro?</h4>
                <p className="text-sm text-gray-600 mb-4">Se perderá todo el progreso de este proceso.</p>
                <div className="flex gap-4 w-full">
                    <button onClick={() => setIsConfirmingCancel(false)} className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">No, volver</button>
                    <button onClick={() => onCancel(process.id)} className="flex-1 py-2 px-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">Sí, cancelar</button>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col bg-white rounded-lg border-2 shadow-sm ${getBorderColor()}`}>
            <header className={`p-3 rounded-t-md`}>
                <h3 className={`font-bold text-lg ${getHeaderColor().split(' ')[1]}`}>{name}</h3>
            </header>
            
            <div className="p-4 flex-grow flex flex-col justify-between">
                <div className="timers flex justify-around text-center mb-4">
                    <div>
                        <span className="text-xs text-gray-500 uppercase font-bold">Total Restante</span>
                        <p className="text-3xl font-bold">{formatTime(totalTimeLeft)}</p>
                    </div>
                    <div>
                        <span className="text-xs text-gray-500 uppercase font-bold">Paso Actual</span>
                        <p className="text-3xl font-bold">{formatTime(stepTimeLeft)}</p>
                    </div>
                </div>

                <div className="steps-list mb-4 p-3 bg-gray-50 rounded-lg max-h-40 overflow-y-auto border border-gray-200">
                    {steps.map((step, index) => (
                        <StepItem 
                            key={index}
                            step={step}
                            isCompleted={index < currentStepIndex}
                            isCurrent={index === currentStepIndex && state !== 'finished'}
                        />
                    ))}
                     {state === 'finished' && (
                        <div className="flex items-start gap-3 py-2 text-green-700 font-bold">
                            <Icon name="check-circle" size={16} className="mt-1" />
                            <p className="text-sm">¡Proceso completado!</p>
                        </div>
                    )}
                </div>
                
                <div className="action-buttons space-y-2">
                    {renderAction()}
                    {state !== 'finished' && (
                        <button 
                            onClick={() => setIsConfirmingCancel(true)}
                            className="w-full text-center text-xs text-gray-500 hover:text-red-600 font-semibold py-1 transition-colors"
                        >
                            Cancelar Proceso
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProcessCard;